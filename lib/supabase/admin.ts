import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * ⚠️ SERVER-ONLY. Never import this into a Client Component or
 * anything that ships to the browser — it uses the service_role key
 * which bypasses Row Level Security.
 *
 * Used for: Paystack webhook handler (confirming payment, decrementing
 * stock/ticket counts), and other privileged server-side operations.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
