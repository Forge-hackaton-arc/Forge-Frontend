import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only the anon key ever ships to the browser — the backend's service-role key
// stays server-side in Forge-Backend. Realtime subscriptions here need SELECT
// granted to `anon` on jobs/reputation/payments (see .env.local.example).
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const supabaseConfigured = Boolean(supabase);
