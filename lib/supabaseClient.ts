import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in your Supabase project values."
    );
  }

  cached = createClient(url, anonKey, { auth: { persistSession: false } });
  return cached;
}

// Lazily initialized so importing this module (e.g. during `next build`'s
// page-data collection, before real env vars exist) never throws - only
// actually calling a Supabase method does.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
