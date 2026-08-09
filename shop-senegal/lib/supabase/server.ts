import "server-only";
import { createClient } from "@supabase/supabase-js";

// This client uses the secret key and bypasses Row Level Security.
// `import "server-only"` above makes any accidental import from a "use client"
// component fail the build instead of leaking the key to the browser.

function getUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  return url;
}

function getSecretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Missing env: SUPABASE_SECRET_KEY");
  return key;
}

/**
 * Server-only client (secret key — Supabase's new API key format, replaces
 * the legacy "service_role" JWT) — bypasses RLS. Used to write payment rows
 * and to read a payment by reference for the confirmation page (the
 * `payments` table has no RLS policies, so the publishable-key client
 * can't read it).
 */
export const supabaseAdmin = createClient(getUrl(), getSecretKey(), {
  auth: { persistSession: false },
});
