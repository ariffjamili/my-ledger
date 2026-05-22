// Supabase client initialisation.
//
// This file is loaded on every page after the Supabase JS SDK has been
// included via CDN. It exposes `window.supabaseClient` for use by all
// other modules (auth, transactions, storage, etc.).
//
// Credentials may be provided in two ways:
//   1. Inline (edit the constants below) — simplest for static hosting.
//   2. Override at runtime via `window.ENV` (set before this script runs).
//      Useful if you generate an env.js file at deploy time.
//
// IMPORTANT: Only the anon/public key belongs here.
// Never put the service_role key in any client-side file.

const SUPABASE_URL =
  (typeof window !== 'undefined' && window.ENV && window.ENV.SUPABASE_URL) ||
  'https://your-project.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof window !== 'undefined' && window.ENV && window.ENV.SUPABASE_ANON_KEY) ||
  'your-anon-key';

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
  throw new Error(
    'Supabase SDK not loaded. Include <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> before assets/js/supabase.js.'
  );
}

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
