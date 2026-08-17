// ── Auth middleware ──
function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please log in to continue.' };
    return res.redirect('/auth/login');
  }
  next();
}

function redirectIfAuth(req, res, next) {
  if (req.session.user) {
    return res.redirect('/app/dashboard');
  }
  next();
}

function requireStudent(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please log in to continue.' };
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'student' && req.session.user.role !== 'psychologist') {
    req.session.flash = { type: 'info', message: 'Student tools are available for psychology students.' };
    return res.redirect('/app/dashboard');
  }
  next();
}

// ── Flash helper ──
function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

module.exports = { requireAuth, redirectIfAuth, requireStudent, setFlash };