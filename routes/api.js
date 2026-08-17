const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth, requireOwnership } = require('../middleware/auth');
const { generateAIResponse } = require('../lib/ai-engine');

// ── AI conversation endpoint (enhanced, human-like responses) ──
router.post('/chat', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { conversation_id, message } = req.body;

  if (!message || !message.trim()) {
    return res.json({ success: false, error: 'Please say something.' });
  }

  // CRITICAL: Verify the user owns this conversation (prevent data snooping)
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(conversation_id, userId);
  if (!conv) {
    return res.status(403).json({ success: false, error: 'Conversation not found.' });
  }

  // Save user message
  db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)')
    .run(conversation_id, 'user', message);

  db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conversation_id);

  // Get conversation history for context
  const history = db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 10').all(conversation_id);
  const reversedHistory = history.reverse().map(m => ({ role: m.role, content: m.content }));

  // Generate response using enhanced AI engine
  const aiResponse = generateAIResponse(message, reversedHistory);

  // Save AI message
  db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)')
    .run(conversation_id, 'assistant', aiResponse);

  res.json({ success: true, response: aiResponse });
});

// ── Get conversation messages (ownership verified) ──
router.get('/conversation/:id/messages', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!conv) return res.json({ success: false, error: 'Not found' });

  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json({ success: true, messages });
});

// ── Create reflection ──
router.post('/reflect/create', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { conversation_id, emotion, trigger, pattern, insight } = req.body;
  db.prepare('INSERT INTO reflections (user_id, conversation_id, emotion, trigger, pattern, insight) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId, conversation_id || null, emotion || '', trigger || '', pattern || '', insight || '');
  res.json({ success: true });
});

// ── Crisis resources API (public, always accessible) ──
router.get('/crisis-resources', (req, res) => {
  const resources = {
    india: [
      { name: 'iCall', phone: '9152987821', description: 'Free mental health helpline by TISS', hours: 'Mon-Sat, 8 AM - 10 PM' },
      { name: 'Vandrevala Foundation', phone: '1860-2662-345', description: '24/7 mental health support', hours: '24/7' },
      { name: 'NIMHANS', phone: '080-46110007', description: 'National Institute of Mental Health helpline', hours: '24/7' },
    ],
    emergency: [
      { name: 'Emergency', phone: '112', description: 'National emergency number', hours: '24/7' },
      { name: 'AASRA', phone: '9820466726', description: 'Suicide prevention helpline', hours: '24/7' },
    ],
  };
  res.json({ success: true, resources });
});

module.exports = router;