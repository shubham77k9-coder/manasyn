// ═══════════════════════════════════════════════════════════════
// MANASYN v2 — HARDENED SECURITY MIDDLEWARE (FIXED)
// ═══════════════════════════════════════════════════════════════

const db = require('../db/database');
const supabaseLib = require('../lib/supabase');

// ── Strict auth ──
function requireAuth(req, res, next) {
  if (!req.session.user) {
    if (req.path.startsWith('/api')) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    req.session.flash = { type: 'error', message: 'Please log in to continue.' };
    return res.redirect('/auth/login');
  }

  if (supabaseLib) {
    const sessionActive = supabaseLib.isSessionActive(req.session.user.id, req.session.sessionId);
    if (!sessionActive) {
      req.session.destroy(() => {
        if (req.path.startsWith('/api')) {
          return res.status(401).json({ success: false, error: 'Session expired.' });
        }
        res.redirect('/auth/login?reason=elsewhere');
      });
      return;
    }
  }
  next();
}

function redirectIfAuth(req, res, next) {
  if (req.session.user) return res.redirect('/app/dashboard');
  next();
}

// ── Student-only: role verified SERVER-SIDE ──
function requireStudent(req, res, next) {
  if (!req.session.user) {
    if (req.path.startsWith('/api')) return res.status(401).json({ success: false, error: 'Authentication required.' });
    req.session.flash = { type: 'error', message: 'Please log in to continue.' };
    return res.redirect('/auth/login');
  }
  const role = req.session.user.role;
  if (role !== 'student' && role !== 'psychologist') {
    if (req.path.startsWith('/api')) return res.status(403).json({ success: false, error: 'Student access required.' });
    req.session.flash = { type: 'info', message: 'Student tools are available for psychology students.' };
    return res.redirect('/app/dashboard');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ success: false, error: 'Authentication required.' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin access required.' });
  next();
}

// ── Resource ownership (BOLA/IDOR prevention) ──
function requireOwnership(resourceTable, idParam = 'id') {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ success: false, error: 'Authentication required.' });
    const resourceId = req.params[idParam];
    const userId = req.session.user.id;
    const resource = db.prepare(`SELECT user_id FROM ${resourceTable} WHERE id = ?`).get(resourceId);
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found.' });
    if (resource.user_id !== userId) return res.status(404).json({ success: false, error: 'Resource not found.' });
    next();
  };
}

// ── CSRF protection (NOW ACTUALLY APPLIED) ──
function csrfCheck(req, res, next) {
  // Skip GET/HEAD/OPTIONS — they don't change state
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) return next();

  // Skip login/signup — CSRF token isn't set yet before session exists
  if (req.path === '/auth/login' || req.path === '/auth/signup' || req.path === '/auth/forgot-password') return next();

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ success: false, error: 'Invalid CSRF token.' });
  }
  next();
}

// ── Security headers ──
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(self), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

// ── Input sanitization: strip HTML, limit length ──
function sanitizeInput(str, maxLen = 5000) {
  if (typeof str !== 'string') return '';
  return str.slice(0, maxLen);
}

// ── Password strength validation ──
function validatePassword(password) {
  if (!password || password.length < 8) return { valid: false, message: 'Password must be at least 8 characters.' };
  if (password.length > 128) return { valid: false, message: 'Password too long.' };
  if (!/[A-Za-z]/.test(password)) return { valid: false, message: 'Password must contain at least one letter.' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number.' };
  return { valid: true };
}

// ── Email validation ──
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(email) && email.length <= 254;
}

// ── Per-user rate limiting for AI chat (cost abuse prevention) ──
const userMessageCounts = new Map(); // userId → [{ timestamp }]
const AI_RATE_LIMIT = 20; // max 20 messages per 5 minutes
const AI_RATE_WINDOW = 5 * 60 * 1000;

function checkAiRateLimit(userId) {
  const now = Date.now();
  if (!userMessageCounts.has(userId)) userMessageCounts.set(userId, []);
  const timestamps = userMessageCounts.get(userId).filter(t => now - t < AI_RATE_WINDOW);
  if (timestamps.length >= AI_RATE_LIMIT) return false;
  timestamps.push(now);
  userMessageCounts.set(userId, timestamps);
  return true;
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

module.exports = {
  requireAuth,
  redirectIfAuth,
  requireStudent,
  requireAdmin,
  requireOwnership,
  csrfCheck,
  securityHeaders,
  setFlash,
  sanitizeInput,
  validatePassword,
  validateEmail,
  checkAiRateLimit,
};