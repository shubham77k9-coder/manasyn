const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireStudent, setFlash } = require('../middleware/auth');

// ── Student dashboard ──
router.get('/dashboard', requireStudent, (req, res) => {
  const userId = req.session.user.id;
  const progress = db.prepare('SELECT * FROM learning_progress WHERE user_id = ?').all(userId);
  const cases = db.prepare('SELECT COUNT(*) as count FROM case_scenarios').get().count;
  const osceQs = db.prepare('SELECT COUNT(*) as count FROM osce_questions').get().count;
  const flashcards = db.prepare('SELECT COUNT(*) as count FROM flashcards').get().count;
  res.render('student/dashboard', { title: 'Student Dashboard — Manasyn', progress, cases, osceQs, flashcards });
});

// ── Case Coach ──
router.get('/case-coach', requireStudent, (req, res) => {
  const cases = db.prepare('SELECT * FROM case_scenarios ORDER BY id').all();
  res.render('student/case-coach', { title: 'Case Coach — Manasyn', cases });
});

router.get('/case-coach/:id', requireStudent, (req, res) => {
  const caseData = db.prepare('SELECT * FROM case_scenarios WHERE id = ?').get(req.params.id);
  if (!caseData) { setFlash(req, 'error', 'Case not found.'); return res.redirect('/student/case-coach'); }
  const responses = db.prepare('SELECT * FROM case_responses WHERE user_id = ? AND case_id = ? ORDER BY created_at DESC').all(req.session.user.id, req.params.id);
  res.render('student/case-detail', { title: caseData.title + ' — Manasyn', caseData, responses });
});

router.post('/case-coach/:id/respond', requireStudent, (req, res) => {
  const userId = req.session.user.id;
  const { action_type, response_text } = req.body;
  const feedback = generateCaseFeedback(action_type, response_text);
  db.prepare('INSERT INTO case_responses (user_id, case_id, action_type, response_text, feedback) VALUES (?, ?, ?, ?, ?)').run(userId, req.params.id, action_type || '', response_text || '', feedback);
  res.json({ success: true, feedback });
});

// ── OSCE Viva ──
router.get('/osce', requireStudent, (req, res) => {
  const questions = db.prepare('SELECT * FROM osce_questions ORDER BY id').all();
  res.render('student/osce', { title: 'OSCE Viva — Manasyn', questions });
});

router.get('/osce/:id', requireStudent, (req, res) => {
  const question = db.prepare('SELECT * FROM osce_questions WHERE id = ?').get(req.params.id);
  if (!question) { setFlash(req, 'error', 'Question not found.'); return res.redirect('/student/osce'); }
  const responses = db.prepare('SELECT * FROM osce_responses WHERE user_id = ? AND question_id = ? ORDER BY created_at DESC').all(req.session.user.id, req.params.id);
  res.render('student/osce-detail', { title: 'OSCE Viva — Manasyn', question, responses });
});

router.post('/osce/:id/respond', requireStudent, (req, res) => {
  const userId = req.session.user.id;
  const { user_answer } = req.body;
  const scores = generateOsceScores(user_answer);
  db.prepare('INSERT INTO osce_responses (user_id, question_id, user_answer, clinical_reasoning, communication, ethics, structure, feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(userId, req.params.id, user_answer || '', scores.clinical_reasoning, scores.communication, scores.ethics, scores.structure, scores.feedback);
  res.json({ success: true, scores });
});

// ── Skills Lab ──
router.get('/skills-lab', requireStudent, (req, res) => {
  const scenarios = db.prepare('SELECT * FROM skills_scenarios ORDER BY id').all();
  res.render('student/skills-lab', { title: 'Skills Lab — Manasyn', scenarios });
});

router.get('/skills-lab/:id', requireStudent, (req, res) => {
  const scenario = db.prepare('SELECT * FROM skills_scenarios WHERE id = ?').get(req.params.id);
  if (!scenario) { setFlash(req, 'error', 'Scenario not found.'); return res.redirect('/student/skills-lab'); }
  res.render('student/skills-detail', { title: scenario.skill_name + ' — Manasyn', scenario });
});

router.post('/skills-lab/:id/respond', requireStudent, (req, res) => {
  const userId = req.session.user.id;
  const { chosen_option } = req.body;
  const scenario = db.prepare('SELECT * FROM skills_scenarios WHERE id = ?').get(req.params.id);
  const isCorrect = chosen_option === scenario.correct_response ? 1 : 0;
  db.prepare('INSERT INTO skills_responses (user_id, scenario_id, chosen_option, is_correct) VALUES (?, ?, ?, ?)').run(userId, req.params.id, chosen_option || '', isCorrect);
  res.json({ success: true, isCorrect: !!isCorrect, correct: scenario.correct_response, explanation: scenario.explanation });
});

// ── Flashcards ──
router.get('/flashcards', requireStudent, (req, res) => {
  const decks = db.prepare('SELECT d.*, COUNT(f.id) as card_count FROM flashcard_decks d LEFT JOIN flashcards f ON f.deck_id = d.id GROUP BY d.id').all();
  res.render('student/flashcards', { title: 'Flashcards — Manasyn', decks });
});

router.get('/flashcards/deck/:id', requireStudent, (req, res) => {
  const deck = db.prepare('SELECT * FROM flashcard_decks WHERE id = ?').get(req.params.id);
  if (!deck) { setFlash(req, 'error', 'Deck not found.'); return res.redirect('/student/flashcards'); }
  const cards = db.prepare('SELECT * FROM flashcards WHERE deck_id = ? ORDER BY id').all(deck.id);
  res.render('student/flashcards-deck', { title: deck.name + ' — Manasyn', deck, cards });
});

router.post('/flashcards/:id/review', requireStudent, (req, res) => {
  const userId = req.session.user.id;
  const { rating } = req.body;
  db.prepare('INSERT INTO flashcard_reviews (user_id, flashcard_id, rating) VALUES (?, ?, ?)').run(userId, req.params.id, rating || 'good');
  res.json({ success: true });
});

// ── Research Helper ──
router.get('/research', requireStudent, (req, res) => { res.render('student/research', { title: 'Research Helper — Manasyn' }); });

router.post('/research/generate', requireStudent, (req, res) => {
  const { question, research_type } = req.body;
  const framework = generateResearchFramework(question, research_type);
  res.json({ success: true, framework });
});

// ── Helpers ──
function generateCaseFeedback(actionType, responseText) {
  const feedbacks = {
    'ask': 'Good start — gathering more information helps build rapport and understand the client\'s experience. Consider asking open-ended questions about onset, duration, and impact.',
    'history': 'Reviewing history is important. Make sure to explore family background, previous mental health episodes, and social context.',
    'differential': 'Considering differentials shows clinical reasoning. Document your reasoning for each possibility and what would confirm or rule out each.',
    'formulate': 'A formulation brings together predisposing, precipitating, perpetuating, and protective factors. Make sure your formulation is person-centered.',
  };
  return feedbacks[actionType] || 'Thank you for your response. Reflect on how this approach serves the client\'s needs.';
}

function generateOsceScores(answer) {
  if (!answer || answer.length < 20) {
    return { clinical_reasoning: 4, communication: 5, ethics: 4, structure: 4, feedback: 'Your answer was brief. In a viva, elaborate on your clinical reasoning and demonstrate structured thinking.' };
  }
  const len = answer.length;
  const hasStructure = /first|then|finally|step|approach/i.test(answer);
  const hasEthics = /consent|confidential|safety|risk|autonomy/i.test(answer);
  return {
    clinical_reasoning: Math.min(10, 6 + Math.floor(len / 100)),
    communication: Math.min(10, 7 + (hasStructure ? 2 : 0)),
    ethics: Math.min(10, 5 + (hasEthics ? 4 : 1)),
    structure: Math.min(10, 6 + (hasStructure ? 3 : 0)),
    feedback: 'Consider exploring substance use history and ruling out medical conditions that could mimic symptoms before proceeding to formal diagnosis.',
  };
}

function generateResearchFramework(question, type) {
  return {
    research_question: question || 'How do individuals experiencing anxiety disorders perceive the effectiveness of mindfulness-based interventions?',
    variables: type === 'quantitative' ? 'Independent: Mindfulness practice frequency. Dependent: Self-reported anxiety levels (GAD-7). Mediating: Perceived stress (PSS-10).' : 'Central phenomenon: Lived experience of anxiety and mindfulness practice. Context: Daily life and clinical settings.',
    hypothesis: type === 'quantitative' ? 'Individuals who engage in regular mindfulness practice will report significantly lower anxiety scores compared to a control group.' : 'Participants will describe mindfulness as a meaningful coping strategy that changes their relationship with anxious thoughts.',
    methodology: type === 'quantitative' ? 'Randomized controlled trial with pre/post measures. Sample: 60 participants, 8-week intervention. Analysis: ANCOVA.' : 'Interpretative Phenomenological Analysis (IPA). Semi-structured interviews with 12-15 participants. Thematic analysis using Braun & Clarke (2006).',
    measures: 'GAD-7, MAAS (Mindful Attention Awareness Scale), PSS-10 (Perceived Stress Scale), demographic questionnaire',
    search_strategy: 'PubMed, PsycINFO, Scopus, Cochrane Library. Keywords: mindfulness, anxiety, intervention, qualitative, lived experience. Date range: 2014-2024.',
  };
}

module.exports = router;