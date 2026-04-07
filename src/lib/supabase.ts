import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
};

// Cliente publico (para el browser)
export const supabase: SupabaseClient =
  globalForSupabase.supabase ||
  (supabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as unknown as SupabaseClient));

// Cliente con permisos elevados (solo para el servidor - uploads, etc.)
export const supabaseAdmin: SupabaseClient =
  globalForSupabase.supabaseAdmin ||
  (supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : supabase);

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
  globalForSupabase.supabaseAdmin = supabaseAdmin;
}
