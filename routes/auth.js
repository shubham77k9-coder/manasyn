const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db/database');
const { requireAuth, redirectIfAuth, setFlash } = require('../middleware/auth');
const supabaseLib = require('../lib/supabase');

// ── Login ──
router.get('/login', redirectIfAuth, (req, res) => {
  const reason = req.query.reason;
  let flash = null;
  if (reason === 'elsewhere') {
    flash = { type: 'info', message: 'You logged in from another device. For security, you can only be logged in one place at a time.' };
  }
  if (req.session.flash) flash = req.session.flash;
  req.session.flash = null;
  res.render('auth/login', { title: 'Welcome back — Manasyn', flash });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    setFlash(req, 'error', 'Please enter your email and password.');
    return res.redirect('/auth/login');
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    setFlash(req, 'error', 'No account found with that email. Would you like to sign up?');
    return res.redirect('/auth/login');
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    setFlash(req, 'error', 'Incorrect password. Please try again.');
    return res.redirect('/auth/login');
  }

  // ── Single-session enforcement ──
  // Generate a unique session ID for this login
  const sessionId = crypto.randomBytes(32).toString('hex');

  if (supabaseLib) {
    const registered = supabaseLib.registerSession(user.id, sessionId);
    if (!registered) {
      // Already logged in elsewhere — deny
      setFlash(req, 'error', 'You are already logged in on another device. Please log out there first.');
      return res.redirect('/auth/login');
    }
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role, // From DB, not client — cannot be tampered
    onboarding_complete: user.onboarding_complete,
  };
  req.session.sessionId = sessionId;

  // Ensure settings row exists
  db.prepare('INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)').run(user.id);

  if (!user.onboarding_complete) {
    return res.redirect('/auth/onboarding');
  }
  setFlash(req, 'success', `Welcome back, ${user.name || 'friend'}.`);
  res.redirect('/app/dashboard');
});

// ── Signup (progressive) ──
router.get('/signup', redirectIfAuth, (req, res) => {
  res.render('auth/signup', { title: 'Create your account — Manasyn', step: 1, data: {} });
});

router.post('/signup', (req, res) => {
  const { step, name, email, password, intent, role, goals } = req.body;

  if (step === '1') {
    if (!email || !password || password.length < 6) {
      setFlash(req, 'error', 'Please enter a valid email and a password of at least 6 characters.');
      return res.redirect('/auth/signup');
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      setFlash(req, 'error', 'An account with that email already exists. Try logging in.');
      return res.redirect('/auth/login');
    }
    return res.render('auth/signup', { title: 'Tell us about you — Manasyn', step: 2, data: { email, password } });
  }

  if (step === '2') {
    return res.render('auth/signup', { title: 'Choose your role — Manasyn', step: 3, data: { email, password, name, intent } });
  }

  if (step === '3') {
    return res.render('auth/signup', { title: 'What are your goals? — Manasyn', step: 4, data: { email, password, name, intent, role } });
  }

  if (step === '4') {
    const hash = bcrypt.hashSync(password, 10);
    const finalRole = role || 'personal'; // Server decides role, never client
    const focusGoals = Array.isArray(goals) ? goals.join(', ') : (goals || '');

    const result = db.prepare(`
      INSERT INTO users (name, email, password, role, onboarding_complete, onboarding_intent, onboarding_focus)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `).run(name || '', email, hash, finalRole, intent || '', focusGoals);

    db.prepare('INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)').run(result.lastInsertRowid);

    // ── Single-session registration ──
    const sessionId = crypto.randomBytes(32).toString('hex');
    if (supabaseLib) {
      supabaseLib.registerSession(result.lastInsertRowid, sessionId);
    }

    req.session.user = {
      id: result.lastInsertRowid,
      name: name || '',
      email,
      role: finalRole,
      onboarding_complete: 1,
    };
    req.session.sessionId = sessionId;

    seedSelfWork(result.lastInsertRowid);

    setFlash(req, 'success', 'Your account is ready. Welcome to Manasyn.');
    res.redirect('/app/dashboard');
  }
});

// ── Onboarding ──
router.get('/onboarding', requireAuth, (req, res) => {
  if (req.session.user.onboarding_complete) {
    return res.redirect('/app/dashboard');
  }
  res.render('auth/onboarding', { title: 'Let\'s get started — Manasyn' });
});

router.post('/onboarding', requireAuth, (req, res) => {
  const { intent } = req.body;
  db.prepare('UPDATE users SET onboarding_complete = 1, onboarding_intent = ? WHERE id = ?')
    .run(intent || '', req.session.user.id);
  req.session.user.onboarding_complete = 1;
  seedSelfWork(req.session.user.id);
  setFlash(req, 'success', 'You\'re all set. Let\'s begin.');
  res.redirect('/app/dashboard');
});

// ── Logout (unregister session) ──
router.post('/logout', (req, res) => {
  if (supabaseLib && req.session.user) {
    supabaseLib.unregisterSession(req.session.user.id, req.session.sessionId);
  }
  req.session.destroy(() => res.redirect('/'));
});

router.get('/logout', (req, res) => {
  if (supabaseLib && req.session.user) {
    supabaseLib.unregisterSession(req.session.user.id, req.session.sessionId);
  }
  req.session.destroy(() => res.redirect('/'));
});

// ── Forgot password ──
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { title: 'Reset password — Manasyn' });
});

router.post('/forgot-password', (req, res) => {
  setFlash(req, 'info', 'If an account exists for that email, a reset link has been sent.');
  res.redirect('/auth/login');
});

function seedSelfWork(userId) {
  const exercises = [
    { title: 'Name the feeling', desc: 'Take 2 minutes to identify what you\'re experiencing.', step: 1 },
    { title: 'Notice the thought', desc: 'Observe the thought pattern without judgment.', step: 2 },
    { title: 'Choose one small action', desc: 'Pick something you can do in the next 10 minutes.', step: 3 },
  ];
  const stmt = db.prepare('INSERT INTO self_work_exercises (user_id, title, description, step_number) VALUES (?, ?, ?, ?)');
  exercises.forEach(e => stmt.run(userId, e.title, e.desc, e.step));
}

module.exports = router;