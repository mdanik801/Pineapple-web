import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Format: "<saltHex>:<hashHex>" (scrypt, 64-byte key) — same shape as existing customers.password_hash rows.
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  // Try salt as utf8 string (Node default usage), then as raw hex bytes.
  for (const s of [salt, Buffer.from(salt, "hex")]) {
    try {
      const got = scryptSync(password, s, expected.length);
      if (got.length === expected.length && timingSafeEqual(got, expected)) return true;
    } catch {}
  }
  return false;
}
