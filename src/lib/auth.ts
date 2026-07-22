/**
 * Custom Admin Authentication Library
 * Uses bcryptjs for password hashing — no Supabase Auth involved.
 * Supabase is used only as a plain database for storing the hash and admin records.
 */

import bcrypt from 'bcryptjs';
import { supabase } from './supabase';

// ─── Session Keys ──────────────────────────────────────────────────────────────
const SESSION_KEY  = 'admin_session_v2';
const EMAIL_KEY    = 'admin_email';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface AdminSession {
  email: string;
  loginTime: number;
}

// ─── Password Utilities ────────────────────────────────────────────────────────

// The default initial password is: Agentsva#Panel47
const DEFAULT_INITIAL_HASH = '$2b$12$waYPyRXTwB/QJJgEYTCYUeGPhqfl2j35CT9/.Pz5vJFLeORJfWuSu';

/**
 * Fetch the current global password hash from the database.
 * Fallback: If not found, attempt to create it and return the default hash.
 */
export async function getPasswordHash(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('password_hash')
      .eq('id', 1)
      .maybeSingle();

    if (data?.password_hash) {
      return data.password_hash;
    }

    // If it doesn't exist, try to insert the initial hash (setup logic)
    console.log('No password hash found. Running initial setup...');
    const { error: insertError } = await supabase
      .from('admin_settings')
      .insert([{ id: 1, password_hash: DEFAULT_INITIAL_HASH }]);
      
    if (insertError) {
      console.warn('Could not insert default hash (might be RLS or missing table):', insertError.message);
    }

    // Return the default hash as fallback so the app still works
    return DEFAULT_INITIAL_HASH;
  } catch (err) {
    console.error('Error fetching password hash:', err);
    return DEFAULT_INITIAL_HASH;
  }
}

/**
 * Verify a plaintext password against the stored bcrypt hash.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Hash a new plaintext password with bcrypt (cost 12).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

/**
 * Update the global admin password in the database.
 * Call this only after verifying the current password.
 */
export async function updatePasswordHash(newHash: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('admin_settings')
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) {
    console.error('Failed to update password hash:', error);
    return { error: error.message };
  }
  return { error: null };
}

// ─── Admin User Tracking ───────────────────────────────────────────────────────

/**
 * Upsert the logged-in email into the admins table.
 * Creates the record if it doesn't exist; updates last_active if it does.
 */
export async function upsertAdminUser(email: string, name?: string): Promise<void> {
  const { error } = await supabase
    .from('admins')
    .upsert(
      {
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        status: 'Active',
        last_active: 'Just now',
        role: 'Owner',
      },
      { onConflict: 'email', ignoreDuplicates: false }
    );

  if (error) {
    console.warn('Failed to upsert admin user:', error);
  }
}

/**
 * Insert a login event into the access log.
 */
export async function logAdminAccess(email: string): Promise<void> {
  const { error } = await supabase
    .from('admin_access_log')
    .insert({ email: email.toLowerCase() });

  if (error) {
    console.warn('Failed to log admin access:', error);
  }
}

// ─── Session Management ────────────────────────────────────────────────────────

/**
 * Persist the admin session in localStorage.
 */
export function saveSession(email: string): void {
  const session: AdminSession = { email: email.toLowerCase(), loginTime: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(EMAIL_KEY, email.toLowerCase());
  // Keep the legacy key for backward compatibility with other components
  localStorage.setItem('admin_authenticated', 'true');
}

/**
 * Retrieve the current session from localStorage.
 * Returns null if no session exists.
 */
export function getSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

/**
 * Clear all session data from localStorage (logout).
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem('admin_authenticated');
  localStorage.removeItem('admin_email');
}

/**
 * Check if a valid session exists.
 */
export function isSessionValid(): boolean {
  return getSession() !== null;
}
