const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
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

// ── Security ──
app.use(helmet({
  contentSecurityPolicy: false, // dev-friendly; tighten in production
  crossOriginEmbedderPolicy: false,
}));

// ── Rate limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP. Please try again later.',
});
app.use('/api', limiter);

// ── Middleware ──
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// ── Session ──
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'db') }),
  secret: process.env.SESSION_SECRET || 'manasyn-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ── Theme middleware (reads ?theme or user setting) ──
app.use((req, res, next) => {
  if (req.query.theme) {
    req.session.theme = req.query.theme;
  }
  res.locals.theme = req.session.theme || 'light';
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  next();
});

// ── Static ──
app.use(express.static(path.join(__dirname, 'public')));

// ── Flash messages ──
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || null;
  req.session.flash = null;
  next();
});

// ── Routes ──
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/app');
const studentRoutes = require('./routes/student');
const apiRoutes = require('./routes/api');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/app', appRoutes);
app.use('/student', studentRoutes);
app.use('/api', apiRoutes);

// ── 404 ──
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Page not found — Manasyn' });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/500', { title: 'Something went wrong — Manasyn' });
});

// ── Start ──
seed.seedIfEmpty();

app.listen(PORT, () => {
  console.log(`\n  Manasyn running on http://localhost:${PORT}\n  Support · Reflect · Grow\n`);
});

module.exports = app;