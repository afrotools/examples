import { createClient } from "@supabase/supabase-js";

function getUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  return url;
}

function getPublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key)
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return key;
}

/**
 * Public client (publishable key — Supabase's new API key format, replaces
 * the legacy "anon" JWT) — safe to use in Server Components for public
 * reads (e.g. the product catalog). RLS on the `products` table allows
 * public SELECT; every other table denies anon/publishable access by default.
 */
export const supabase = createClient(getUrl(), getPublishableKey());
