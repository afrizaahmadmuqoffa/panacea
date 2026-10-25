import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAdminEnv } from "@/lib/env";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;
  const { url, secretKey } = requireSupabaseAdminEnv();
  adminClient = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return adminClient;
}
