import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase environment variables are not configured");
}

const SUPABASE_URL_VALUE = SUPABASE_URL as string;
const SUPABASE_ANON_KEY_VALUE = SUPABASE_ANON_KEY as string;

export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  const refreshToken = cookieStore.get("sb-refresh-token")?.value;

  const client = createClient(SUPABASE_URL_VALUE, SUPABASE_ANON_KEY_VALUE, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  if (accessToken && refreshToken) {
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      cookieStore.delete("sb-access-token");
      cookieStore.delete("sb-refresh-token");
    }
  }

  return client;
}
