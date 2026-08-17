// ═══════════════════════════════════════════════════════════════
// Manasyn v2 — Supabase Client (Server-side only)
// This file uses the SERVICE_ROLE_KEY — NEVER import in frontend code.
// ═══════════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase env vars not set. Using fallback session auth.');
  module.exports = null;
} else {
  // Admin client — bypasses RLS, server-only
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Verify a JWT token from the frontend
  async function verifyToken(token) {
    if (!token) return null;
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return null;
      return data.user;
    } catch (e) {
      return null;
    }
  }

  // Get user's role from Supabase user metadata
  function getUserRole(user) {
    if (!user) return 'personal';
    return user.user_metadata?.role || 'personal';
  }

  // Check if a user's session is still valid (single-session enforcement)
  const activeSessions = new Map(); // userId → sessionId

  function registerSession(userId, sessionId) {
    // If already logged in elsewhere, invalidate old session
    if (activeSessions.has(userId)) {
      return false; // Already logged in — deny second session
    }
    activeSessions.set(userId, sessionId);
    return true;
  }

  function unregisterSession(userId, sessionId) {
    if (activeSessions.get(userId) === sessionId) {
      activeSessions.delete(userId);
    }
  }

  function isSessionActive(userId, sessionId) {
    return activeSessions.get(userId) === sessionId;
  }

  module.exports = {
    supabase,
    verifyToken,
    getUserRole,
    registerSession,
    unregisterSession,
    isSessionActive,
  };
}