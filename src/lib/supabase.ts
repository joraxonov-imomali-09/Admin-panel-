import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
    "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist the session in localStorage so it survives page refreshes
    persistSession: true,
    // Automatically refresh the JWT token before it expires
    autoRefreshToken: true,
    // Detect session from URL (needed for OAuth / magic-link callbacks)
    detectSessionInUrl: true,
    // Use localStorage as the storage backend
    storage: window.localStorage,
  },
});
