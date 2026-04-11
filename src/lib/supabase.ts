import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Credenciales SOLO del servidor. No expuestas al bundle del cliente.
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: SupabaseClient;
};

// Cliente con permisos elevados (uso exclusivo en el servidor).
// Bypassea RLS: nunca importar este modulo desde codigo del cliente.
export const supabaseAdmin: SupabaseClient =
  globalForSupabase.supabaseAdmin ||
  (supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : (null as unknown as SupabaseClient));

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabaseAdmin = supabaseAdmin;
}
