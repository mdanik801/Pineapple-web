import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "dyrptcmnmuajeizdwvic.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "www.beginningboutique.com.au" },
      { protocol: "https", hostname: "images.riverisland.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "n.nordstrommedia.com" },
      { protocol: "https", hostname: "www.lulus.com" },
      { protocol: "https", hostname: "images.express.com" },
      { protocol: "https", hostname: "thisisunfolded.com" },
      { protocol: "https", hostname: "www.stfrock.com.au" },
      { protocol: "https", hostname: "images.asos-media.com" },
      { protocol: "https", hostname: "www.selfieleslie.com" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
