import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const supabaseKey =
  serviceRoleKey ||
  (process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    : undefined);

if (!supabaseUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseKey) {
  throw new Error(
    process.env.NODE_ENV === "development"
      ? "Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY to initialize Supabase."
      : "Set SUPABASE_SERVICE_ROLE_KEY to initialize Supabase.",
  );
}

// Server-only client. NEVER import from a client component.
export const db = createClient(
  supabaseUrl,
  supabaseKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
