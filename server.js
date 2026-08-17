// ═══════════════════════════════════════════════════════════════
// MANASYN v2 — ENHANCED SERVER
// Supabase auth, security hardening, single-session, CSRF, animations
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

// Ensure DB + seed
require('./db/database');
const seed = require('./seeders/seed');

const app = express();
const PORT = process.env.MANASYN_PORT || 4567;

// ── View engine ──
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Security (Helmet with safe CSP) ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── Rate limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests. Please slow down.' },
});
app.use('/api', limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts. Try again later.' },
});

// ── Middleware ──
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(self), camera=()');
  next();
});

// ── Session ──
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'db') }),
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  name: 'manasyn_sid', // Don't use default session name
}));

// ── CSRF Token generation ──
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

// ── Theme + user locals ──
app.use((req, res, next) => {
  if (req.query.theme && ['light', 'dark'].includes(req.query.theme)) {
    req.session.theme = req.query.theme;
    // Persist to DB if logged in
    if (req.session.user) {
      const db = require('./db/database');
      db.prepare('UPDATE user_settings SET theme = ? WHERE user_id = ?')
        .run(req.query.theme, req.session.user.id);
    }
  }
  res.locals.theme = req.session.theme || 'light';
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  res.locals.flash = req.session.flash || null;
  req.session.flash = null;
  next();
});

// ── Static ──
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
}));

// ── CSRF protection (applied to all state-changing requests) ──
const { csrfCheck } = require('./middleware/auth');
app.use(csrfCheck);

// ── Routes ──
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/app');
const studentRoutes = require('./routes/student');
const apiRoutes = require('./routes/api');

app.use('/', indexRoutes);
app.use('/auth', authLimiter, authRoutes);
app.use('/app', appRoutes);
app.use('/student', studentRoutes);
app.use('/api', apiRoutes);

// ── Health check (for Render) — minimal info, no version leak ──
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── 404 ──
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page not found — Manasyn',
    theme: res.locals.theme,
    user: null,
  });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/500', {
    title: 'Something went wrong — Manasyn',
    theme: res.locals.theme,
    user: null,
  });
});

// ── Start ──
seed.seedIfEmpty();

app.listen(PORT, () => {
  console.log(`\n  Manasyn v2 running on http://localhost:${PORT}`);
  console.log(`  Support · Reflect · Grow\n`);
});

module.exports = app;