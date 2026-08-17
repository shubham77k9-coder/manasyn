const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth, setFlash } = require('../middleware/auth');

// ── Dashboard ──
router.get('/dashboard', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const stats = {
    reflections: db.prepare('SELECT COUNT(*) as count FROM reflections WHERE user_id = ?').get(userId).count,
    selfWorkCompleted: db.prepare("SELECT COUNT(*) as count FROM self_work_exercises WHERE user_id = ? AND status = 'completed'").get(userId).count,
    selfWorkTotal: db.prepare('SELECT COUNT(*) as count FROM self_work_exercises WHERE user_id = ?').get(userId).count,
    conversations: db.prepare('SELECT COUNT(*) as count FROM conversations WHERE user_id = ?').get(userId).count,
    journals: db.prepare('SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ?').get(userId).count,
  };

  // Weekly consistency (last 7 days)
  const weekActivity = db.prepare(`
    SELECT DATE(created_at) as day, COUNT(*) as count FROM (
      SELECT created_at FROM conversations WHERE user_id = ? AND created_at >= date('now', '-7 days')
      UNION ALL
      SELECT created_at FROM reflections WHERE user_id = ? AND created_at >= date('now', '-7 days')
      UNION ALL
      SELECT created_at FROM journal_entries WHERE user_id = ? AND created_at >= date('now', '-7 days')
      UNION ALL
      SELECT completed_at FROM self_work_exercises WHERE user_id = ? AND completed_at >= date('now', '-7 days')
    )
    GROUP BY DATE(created_at)
  `).all(userId, userId, userId, userId);

  const activeDays = weekActivity.length;

  res.render('app/dashboard', { title: 'Dashboard — Manasyn', stats, activeDays });
});

// ── Talk (Conversation) ──
router.get('/talk', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const conversations = db.prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 10').all(userId);
  res.render('app/talk', { title: 'Talk — Manasyn', conversations });
});

router.get('/talk/:id', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!conv) {
    setFlash(req, 'error', 'Conversation not found.');
    return res.redirect('/app/talk');
  }
  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conv.id);
  res.render('app/conversation', { title: 'Conversation — Manasyn', conv, messages });
});

router.post('/talk/new', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const result = db.prepare('INSERT INTO conversations (user_id, title) VALUES (?, ?)').run(userId, 'New conversation');
  res.redirect(`/app/talk/${result.lastInsertRowid}`);
});

// ── Reflect ──
router.get('/reflect', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const reflections = db.prepare('SELECT * FROM reflections WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  res.render('app/reflect', { title: 'Reflect — Manasyn', reflections });
});

router.post('/reflect', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { emotion, trigger, pattern, insight } = req.body;
  db.prepare('INSERT INTO reflections (user_id, emotion, trigger, pattern, insight) VALUES (?, ?, ?, ?, ?)')
    .run(userId, emotion || '', trigger || '', pattern || '', insight || '');
  setFlash(req, 'success', 'Your reflection has been saved.');
  res.redirect('/app/reflect');
});

// ── Self-work ──
router.get('/self-work', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const exercises = db.prepare('SELECT * FROM self_work_exercises WHERE user_id = ? ORDER BY step_number ASC').all(userId);
  const completed = exercises.filter(e => e.status === 'completed').length;
  res.render('app/self-work', { title: 'Self-Work — Manasyn', exercises, completed, total: exercises.length });
});

router.post('/self-work/:id/complete', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  db.prepare("UPDATE self_work_exercises SET status = 'completed', completed_at = datetime('now') WHERE id = ? AND user_id = ?")
    .run(req.params.id, userId);
  res.json({ success: true });
});

// ── Progress ──
router.get('/progress', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const stats = {
    reflections: db.prepare('SELECT COUNT(*) as count FROM reflections WHERE user_id = ?').get(userId).count,
    selfWorkCompleted: db.prepare("SELECT COUNT(*) as count FROM self_work_exercises WHERE user_id = ? AND status = 'completed'").get(userId).count,
    conversations: db.prepare('SELECT COUNT(*) as count FROM conversations WHERE user_id = ?').get(userId).count,
    journals: db.prepare('SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ?').get(userId).count,
  };

  // Weekly activity
  const weekActivity = db.prepare(`
    SELECT DATE(created_at) as day, COUNT(*) as count FROM (
      SELECT created_at FROM conversations WHERE user_id = ? AND created_at >= date('now', '-7 days')
      UNION ALL SELECT created_at FROM reflections WHERE user_id = ? AND created_at >= date('now', '-7 days')
      UNION ALL SELECT created_at FROM journal_entries WHERE user_id = ? AND created_at >= date('now', '-7 days')
    ) GROUP BY DATE(created_at)
  `).all(userId, userId, userId);

  res.render('app/progress', { title: 'Progress — Manasyn', stats, weekActivity });
});

// ── Journal ──
router.get('/journal', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const entries = db.prepare('SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  res.render('app/journal', { title: 'Journal — Manasyn', entries });
});

router.post('/journal', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { title, content, mood } = req.body;
  if (!content) {
    setFlash(req, 'error', 'Please write something before saving.');
    return res.redirect('/app/journal');
  }
  db.prepare('INSERT INTO journal_entries (user_id, title, content, mood) VALUES (?, ?, ?, ?)')
    .run(userId, title || '', content, mood || '');
  setFlash(req, 'success', 'Your journal entry has been saved.');
  res.redirect('/app/journal');
});

router.post('/journal/:id/delete', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  db.prepare('DELETE FROM journal_entries WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  setFlash(req, 'success', 'Journal entry deleted.');
  res.redirect('/app/journal');
});

// ── Settings ──
router.get('/settings', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
  if (!settings) {
    db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);
    settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
  }
  res.render('app/settings', { title: 'Settings — Manasyn', user, settings });
});

router.post('/settings/account', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { name, email } = req.body;
  db.prepare('UPDATE users SET name = ?, email = ?, updated_at = datetime(\'now\') WHERE id = ?').run(name, email, userId);
  req.session.user.name = name;
  req.session.user.email = email;
  setFlash(req, 'success', 'Your account has been updated.');
  res.redirect('/app/settings');
});

router.post('/settings/preferences', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { theme, notifications_enabled, voice_responses, reduced_motion, language } = req.body;
  db.prepare(`
    UPDATE user_settings SET theme = ?, notifications_enabled = ?, voice_responses = ?, reduced_motion = ?, language = ?
    WHERE user_id = ?
  `).run(
    theme || 'light',
    notifications_enabled ? 1 : 0,
    voice_responses ? 1 : 0,
    reduced_motion ? 1 : 0,
    language || 'en',
    userId
  );
  req.session.theme = theme || 'light';
  setFlash(req, 'success', 'Your preferences have been saved.');
  res.redirect('/app/settings');
});

router.post('/settings/delete-account', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  req.session.destroy(() => {
    res.redirect('/?account=deleted');
  });
});

// ── Export data ──
router.get('/export', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const data = {
    user: db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(userId),
    conversations: db.prepare('SELECT * FROM conversations WHERE user_id = ?').all(userId),
    messages: db.prepare('SELECT m.* FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.user_id = ?').all(userId),
    reflections: db.prepare('SELECT * FROM reflections WHERE user_id = ?').all(userId),
    journal_entries: db.prepare('SELECT * FROM journal_entries WHERE user_id = ?').all(userId),
    self_work: db.prepare('SELECT * FROM self_work_exercises WHERE user_id = ?').all(userId),
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="manasyn-data-export.json"');
  res.json(data);
});

module.exports = router;