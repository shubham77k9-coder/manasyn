const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// ── AI conversation endpoint (rule-based responses, no external API) ──
router.post('/chat', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { conversation_id, message } = req.body;

  if (!message || !message.trim()) {
    return res.json({ success: false, error: 'Message is required.' });
  }

  // Save user message
  db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)')
    .run(conversation_id, 'user', message);

  // Update conversation timestamp
  db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conversation_id);

  // Generate response
  const aiResponse = generateAIResponse(message);

  // Save AI message
  db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)')
    .run(conversation_id, 'assistant', aiResponse);

  res.json({ success: true, response: aiResponse });
});

// ── Get conversation messages ──
router.get('/conversation/:id/messages', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!conv) return res.json({ success: false, error: 'Not found' });

  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json({ success: true, messages });
});

// ── Create reflection from conversation ──
router.post('/reflect/create', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { conversation_id, emotion, trigger, pattern, insight } = req.body;
  db.prepare('INSERT INTO reflections (user_id, conversation_id, emotion, trigger, pattern, insight) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId, conversation_id || null, emotion || '', trigger || '', pattern || '', insight || '');
  res.json({ success: true });
});

// ── Crisis resources API ──
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

// ── Rule-based AI response generator ──
function generateAIResponse(message) {
  const msg = message.toLowerCase();

  // Crisis detection
  if (/suicid|kill myself|end my life|hurt myself|self.?harm|don'?t want to live/i.test(msg)) {
    return "I hear you, and I want you to know that what you're feeling matters. You don't have to carry this alone. Please consider reaching out to a crisis resource right now — in India, you can call iCall at 9152987821 or AASRA at 9820466726. They're available 24/7 and will listen without judgment. Would you like me to help you find more support?";
  }

  // Overwhelm / stress
  if (/overwhelm|stress|too much|can'?t cope|pressure|burnt|burnout/i.test(msg)) {
    return "That sounds like a lot to carry. When everything feels like it's piling up, it can be hard to even know where to start. Would you like to explore what's been making it feel overwhelming, or would you prefer to start with one small thing you could do right now?";
  }

  // Anxiety
  if (/anxious|anxiety|panic|nervous|worried|scared|afraid/i.test(msg)) {
    return "It makes sense that you're feeling this way. Anxiety can feel like your mind is racing ahead of you. Sometimes it helps to slow down and notice what's happening in the moment. Would you like to try a brief grounding exercise, or would you prefer to talk about what's been on your mind?";
  }

  // Sadness / depression
  if (/sad|depress|down|hopeless|empty|lonely|alone|low|dark/i.test(msg)) {
    return "I'm glad you felt able to share that. Those feelings can be heavy, and it takes courage to name them. You don't have to have it all figured out right now. Would you like to explore what's been contributing to how you're feeling, or would it help to just sit with this for a moment?";
  }

  // Anger
  if (/angry|anger|frustrat|irritat|mad|furious/i.test(msg)) {
    return "It sounds like there's a lot of energy behind what you're feeling. Anger often carries important information — it can tell us when something matters to us or when a boundary has been crossed. Would you like to explore what's underneath that feeling?";
  }

  // Sleep
  if (/sleep|insomnia|tired|exhausted|can'?t sleep|nightmare/i.test(msg)) {
    return "Sleep affects so much of how we feel, and when it's disrupted, everything can seem harder. Sometimes there's a pattern to it — thoughts that show up at night, or a routine that's shifted. Would you like to explore what's been happening with your sleep?";
  }

  // Relationships
  if (/relationship|partner|boyfriend|girlfriend|spouse|husband|wife|friend|family|parent|mom|dad/i.test(msg)) {
    return "Relationships can be some of the most meaningful and challenging parts of our lives. It sounds like this is weighing on you. Would you like to talk more about what's been happening, or explore how it's affecting you?";
  }

  // Work / study
  if (/work|study|college|exam|job|career|office|boss|teacher|grade/i.test(msg)) {
    return "It sounds like this is taking up a lot of your mental space. When work or study feels relentless, it can be hard to see the bigger picture. Would you like to break down what's feeling most challenging right now?";
  }

  // Greeting
  if (/^(hi|hello|hey|namaste|good morning|good evening|good afternoon)/i.test(msg.trim())) {
    return "Hello. I'm here to listen. How are you feeling today? You can share as much or as little as you'd like.";
  }

  // Thanks
  if (/thank|thanks|grateful/i.test(msg)) {
    return "You're welcome. I'm glad I could be here. Is there anything else you'd like to explore, or would you like to take a moment to reflect on what we've talked about?";
  }

  // Reflective prompt
  if (/reflect|understand|pattern|why do i|why am i/i.test(msg)) {
    return "That's a meaningful question. Self-understanding often starts with noticing patterns — the thoughts, feelings, and situations that show up repeatedly. Would you like to explore a specific pattern you've noticed, or would it help to start with what you're feeling right now?";
  }

  // Default
  const responses = [
    "Thank you for sharing that. I'd like to understand more — what's that been like for you?",
    "I hear you. Can you tell me a bit more about what that experience has been like?",
    "That sounds important. What feelings come up when you think about this?",
    "I'm here, and I'm listening. Would you like to explore this further, or would it help to take a step back and look at the bigger picture?",
    "It takes courage to put this into words. What would feel most helpful right now — exploring this, or finding a practical next step?",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

module.exports = router;