import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/env";

let publicClient: SupabaseClient | null = null;

export function getSupabasePublic(): SupabaseClient {
  if (publicClient) return publicClient;
  const { url, publishableKey } = requireSupabaseEnv();
  publicClient = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return publicClient;
}
