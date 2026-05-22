// Authentication helpers + page-level guards + logout wiring.
//
// Page guards are driven by <body data-auth="..."> :
//   required    → redirect to /login if no session
//   guest-only  → redirect to /dashboard if a session exists
//   (omitted)   → no auto behaviour (used on /reset-password)
//
// Logout: any element with data-action="logout" signs out on click.

const LOGIN_REDIRECT = '/login';
const DASHBOARD_REDIRECT = '/dashboard';

async function getSession() {
  const { data, error } = await window.supabaseClient.auth.getSession();
  if (error) throw error;
  return data.session;
}

async function getUser() {
  const { data, error } = await window.supabaseClient.auth.getUser();
  if (error) return null;
  return data.user;
}

async function requireSession() {
  const session = await getSession();
  if (!session) {
    window.location.replace(LOGIN_REDIRECT);
    return null;
  }
  return session;
}

async function redirectIfAuthed() {
  const session = await getSession();
  if (session) window.location.replace(DASHBOARD_REDIRECT);
}

async function signIn(email, password) {
  const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUp(email, password) {
  // Category seeding is handled server-side by the on_auth_user_created
  // trigger (db/triggers.sql) — works regardless of email confirmation.
  const { data, error } = await window.supabaseClient.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/login` },
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await window.supabaseClient.auth.signOut();
  if (error) console.error(error);
  window.location.replace(LOGIN_REDIRECT);
}

async function requestPasswordReset(email) {
  const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

async function updatePassword(newPassword) {
  const { data, error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

function wireUp() {
  const mode = document.body && document.body.dataset.auth;
  if (mode === 'required') {
    requireSession();
  } else if (mode === 'guest-only') {
    redirectIfAuthed();
  }
  document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      signOut();
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireUp);
} else {
  wireUp();
}

window.auth = {
  getSession,
  getUser,
  requireSession,
  redirectIfAuthed,
  signIn,
  signUp,
  signOut,
  requestPasswordReset,
  updatePassword,
};
