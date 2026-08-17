const db = require('../db/database');

const seedData = {
  flashcard_decks: [
    { id: 1, name: 'Psychopathology Basics', description: 'Core concepts in clinical psychology', category: 'psychopathology' },
    { id: 2, name: 'Therapeutic Approaches', description: 'Major therapy modalities', category: 'therapy' },
    { id: 3, name: 'Assessment & Diagnosis', description: 'Clinical assessment tools and criteria', category: 'assessment' },
  ],
  flashcards: [
    { deck_id: 1, front: 'What is transference?', back: 'The unconscious redirection of feelings from one person to another, often originating in early significant relationships. The client projects feelings about a past figure onto the therapist.', difficulty: 'medium' },
    { deck_id: 1, front: 'What is the difference between sadness and depression?', back: 'Sadness is a normal emotional response to loss or disappointment that passes with time. Depression is a clinical condition involving persistent low mood (2+ weeks), loss of interest, sleep/appetite changes, cognitive impairment, and functional impairment.', difficulty: 'medium' },
    { deck_id: 1, front: 'What are the core symptoms of Generalized Anxiety Disorder (GAD)?', back: 'Excessive, difficult-to-control worry occurring more days than not for 6+ months, accompanied by at least 3 of: restlessness, fatigue, concentration difficulty, irritability, muscle tension, sleep disturbance.', difficulty: 'hard' },
    { deck_id: 1, front: 'What is catastrophizing?', back: 'A cognitive distortion where one expects the worst possible outcome. The mind jumps to catastrophic conclusions with minimal or no evidence. Common in anxiety disorders.', difficulty: 'easy' },
    { deck_id: 1, front: 'What is the diathesis-stress model?', back: 'A framework explaining mental illness as the result of an interaction between a predisposition (diathesis — genetic, biological, psychological) and environmental stress (life events, trauma).', difficulty: 'medium' },
    { deck_id: 1, front: 'What is rumination?', back: 'Repetitive, passive dwelling on negative thoughts, causes, and consequences of distress. Unlike problem-solving, it does not lead to resolution and is a key feature of depression.', difficulty: 'easy' },
    { deck_id: 1, front: 'What is emotional dysregulation?', back: 'Difficulty in managing, modulating, or responding appropriately to emotional experiences. May involve intense emotional reactions, slow return to baseline, or inability to use coping strategies effectively.', difficulty: 'medium' },

    { deck_id: 2, front: 'What is unconditional positive regard?', back: 'A core condition in person-centered therapy (Rogers). The therapist accepts and supports the client without judgment, regardless of what the client says or does.', difficulty: 'easy' },
    { deck_id: 2, front: 'What is cognitive restructuring?', back: 'A CBT technique involving identification, evaluation, and modification of maladaptive thought patterns. The client learns to challenge automatic thoughts and replace them with balanced alternatives.', difficulty: 'medium' },
    { deck_id: 2, front: 'What is the difference between CBT and DBT?', back: 'CBT focuses on identifying and changing thought patterns. DBT (a form of CBT) adds mindfulness, distress tolerance, emotion regulation, and interpersonal effectiveness skills. DBT was designed for borderline personality disorder.', difficulty: 'hard' },
    { deck_id: 2, front: 'What is motivational interviewing?', back: 'A collaborative, person-centered counseling approach designed to strengthen motivation for change by exploring and resolving ambivalence. Uses OARS: Open questions, Affirmations, Reflections, Summaries.', difficulty: 'medium' },
    { deck_id: 2, front: 'What is exposure therapy?', back: 'A behavioral technique where the client is gradually and repeatedly exposed to feared stimuli in a safe context, reducing avoidance and anxiety response over time. Used for phobias, PTSD, OCD.', difficulty: 'medium' },

    { deck_id: 3, front: 'What does the GAD-7 measure?', back: 'Generalized Anxiety Disorder 7-item scale. A brief self-report tool screening for anxiety severity over the past 2 weeks. Scores: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe.', difficulty: 'easy' },
    { deck_id: 3, front: 'What are the DSM-5 criteria for a major depressive episode?', back: '5+ of the following for 2+ weeks (at least one must be depressed mood or anhedonia): depressed mood, diminished interest, weight change, sleep disturbance, psychomotor changes, fatigue, worthlessness/guilt, concentration difficulty, recurrent thoughts of death.', difficulty: 'hard' },
    { deck_id: 3, front: 'What is a mental status examination (MSE)?', back: 'A structured assessment of a client\'s current mental state, covering: appearance, behavior, speech, mood, affect, thought process, thought content, perception, cognition, insight, judgment.', difficulty: 'medium' },
    { deck_id: 3, front: 'What is the PHQ-9?', back: 'Patient Health Questionnaire 9-item. A self-report tool screening for depression severity over the past 2 weeks. Scores: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe.', difficulty: 'easy' },
  ],
  case_scenarios: [
    { id: 1, title: 'Persistent Low Mood', client_profile: '24-year-old graduate student', presenting_concern: 'Persistent low mood, loss of interest in previously enjoyed activities, difficulty concentrating, and disrupted sleep patterns over the past six weeks. Reports increased academic stress.', difficulty: 'intermediate', category: 'mood' },
    { id: 2, title: 'Recurrent Panic Attacks', client_profile: '35-year-old software professional', presenting_concern: 'Recurrent panic attacks with palpitations, shortness of breath, and fear of losing control. Has started avoiding public transport and crowded places. Symptoms worsening over 3 months.', difficulty: 'intermediate', category: 'anxiety' },
    { id: 3, title: 'Trauma After Accident', client_profile: '28-year-old teacher', presenting_concern: 'Intrusive memories, nightmares, and hypervigilance following a serious car accident 4 months ago. Avoids driving and becomes distressed near traffic. Difficulty sleeping and concentrating at work.', difficulty: 'advanced', category: 'trauma' },
    { id: 4, title: 'Childhood Trauma and Relationships', client_profile: '31-year-old marketing executive', presenting_concern: 'Pattern of unstable relationships, intense fear of abandonment, emotional swings, and impulsive behavior. Reports history of childhood emotional neglect. Sometimes feels "empty".', difficulty: 'advanced', category: 'personality' },
    { id: 5, title: 'Student with Exam Anxiety', client_profile: '20-year-old undergraduate student', presenting_concern: 'Excessive worry about exams leading to procrastination, sleep disturbance, and physical symptoms (headaches, stomach issues). Reports feeling "frozen" during study sessions.', difficulty: 'beginner', category: 'anxiety' },
  ],
  osce_questions: [
    { id: 1, scenario: 'A 45-year-old client presents with persistent sadness, loss of interest in activities, early morning awakening, and significant weight loss over the past 2 months.', question: 'What is your differential diagnosis and what further information would you gather?', model_answer: 'Consider Major Depressive Disorder, adjustment disorder, bipolar depression, or medical causes (hypothyroidism, anemia). Assess suicide risk, previous episodes, family history, substance use, and psychosocial stressors.', category: 'mood', difficulty: 'medium' },
    { id: 2, scenario: 'A 19-year-old college student is brought by friends after expressing thoughts that "people are watching" them and hearing voices commenting on their behavior.', question: 'What is your immediate assessment and management plan?', model_answer: 'Assess safety, nature of psychotic symptoms, duration, substance use, and risk to self/others. Rule out substance-induced psychosis. Consider referral to psychiatry. Do not validate or dismiss the experiences.', category: 'psychosis', difficulty: 'hard' },
    { id: 3, scenario: 'A 35-year-old presents with recurrent panic attacks, avoidance of public spaces, and significant distress affecting daily functioning for 3 months.', question: 'What would you do next?', model_answer: 'Conduct thorough assessment including onset, triggers, avoidance patterns, substance use, and medical rule-outs (cardiac, thyroid). Assess for agoraphobia. Consider CBT with exposure, psychoeducation, and possibly SSRIs.', category: 'anxiety', difficulty: 'medium' },
    { id: 4, scenario: 'A 28-year-old client reports a 6-month history of binge eating episodes followed by self-induced vomiting, occurring 3-4 times per week.', question: 'What is your assessment approach and what would you explore?', model_answer: 'Assess for bulimia nervosa: frequency/duration of binges, compensatory behaviors, body image concerns, electrolyte issues, dental erosion. Explore weight history, triggers, co-morbid depression/anxiety, and assess suicide risk.', category: 'eating', difficulty: 'hard' },
    { id: 5, scenario: 'A 50-year-old client reports difficulty sleeping for 3 months — takes 2 hours to fall asleep, wakes at 3 AM and cannot return to sleep.', question: 'How would you assess and formulate an intervention?', model_answer: 'Assess sleep hygiene, caffeine/alcohol intake, screen time, stressors, mood, and medical conditions. Consider CBT-I, sleep restriction therapy, stimulus control. Rule out depression, anxiety, sleep apnea.', category: 'sleep', difficulty: 'medium' },
    { id: 6, scenario: 'A 16-year-old is brought by parents due to declining grades, social withdrawal, and irritability over the past 4 months.', question: 'What is your differential and assessment plan?', model_answer: 'Consider depression, social anxiety, bullying, substance use, or emerging psychosis. Engage both adolescent (alone) and parents. Assess mood, suicide risk, peer relationships, academic stress, family dynamics, and screen for substance use.', category: 'adolescent', difficulty: 'medium' },
    { id: 7, scenario: 'A 40-year-old client describes a pattern of intense, unstable relationships, fear of abandonment, and emotional swings over several years.', question: 'What features would you assess and what approach would you take?', model_answer: 'Assess for borderline personality disorder: emotional dysregulation, identity disturbance, impulsivity, self-harm history, chronic emptiness. Use a validating approach. Consider DBT referral. Assess suicide/self-harm risk carefully.', category: 'personality', difficulty: 'hard' },
    { id: 8, scenario: 'A 55-year-old reports gradual onset of memory difficulties, getting lost in familiar places, and personality changes over 8 months.', question: 'What is your assessment approach?', model_answer: 'Consider neurocognitive disorder. Conduct cognitive assessment (MMSE/MoCA), rule out reversible causes (B12, thyroid, depression), neuroimaging referral, assess functional impairment, safety (driving, cooking), and family support.', category: 'neurocognitive', difficulty: 'hard' },
  ],
  skills_scenarios: [
    { id: 1, skill_name: 'Active Listening', scenario_text: 'Nobody really understands me.', correct_response: 'It sounds like you\'ve been feeling misunderstood. Can you tell me more about what that\'s been like?', explanation: 'This response reflects back what the client said without judgment. It validates their experience and shows you\'re listening — which builds trust and opens space for them to share more.' },
    { id: 2, skill_name: 'Empathic Reflection', scenario_text: 'I just feel so lost. Everything I try to do goes wrong.', correct_response: 'It sounds like you\'re feeling really stuck and discouraged right now. That must be incredibly frustrating.', explanation: 'This reflects both the content (feeling stuck) and the emotion (discouraged, frustrated). It shows you\'re tracking not just what the client says, but what they\'re feeling.' },
    { id: 3, skill_name: 'Open-Ended Questions', scenario_text: 'I don\'t know if I want to keep going to therapy.', correct_response: 'What is it about therapy that\'s making you feel uncertain?', explanation: 'This is an open question that invites the client to explore their feelings rather than giving a yes/no answer. It shows curiosity without being confrontational.' },
    { id: 4, skill_name: 'Validating', scenario_text: 'I know I shouldn\'t be this upset over something so small, but I just can\'t help it.', correct_response: 'What you\'re feeling makes sense. Even things that seem small can carry a lot of weight. There\'s no "should" about how you feel.', explanation: 'This validates the client\'s emotional experience without dismissing or minimizing it. It also gently challenges the self-criticism ("shouldn\'t be upset").' },
    { id: 5, skill_name: 'Summarizing', scenario_text: 'So first my boss criticized me, then my friend canceled plans, and now I can\'t sleep. Everything feels like it\'s falling apart.', correct_response: 'So it sounds like you\'ve had several difficult things happen in a row — criticism at work, a canceled plan, and now trouble sleeping. And it all feels overwhelming. Is that right?', explanation: 'This summary brings together the key points the client mentioned, shows you\'ve been listening, and checks understanding. It also helps the client see the bigger picture.' },
    { id: 6, skill_name: 'Reframing', scenario_text: 'I failed another exam. I\'m just not smart enough for this.', correct_response: 'You\'re clearly disappointed about the exam. But I\'m curious — what would it be like to look at this as one difficult moment rather than a statement about your intelligence?', explanation: 'This acknowledges the feeling first, then gently invites the client to consider an alternative perspective. It does not dismiss or argue — it opens a door.' },
  ],
};

function seedIfEmpty() {
  const deckCount = db.prepare('SELECT COUNT(*) as count FROM flashcard_decks').get().count;
  if (deckCount === 0) {
    console.log('  Seeding database...');

    const insertDeck = db.prepare('INSERT INTO flashcard_decks (id, name, description, category) VALUES (?, ?, ?, ?)');
    seedData.flashcard_decks.forEach(d => insertDeck.run(d.id, d.name, d.description, d.category));

    const insertCard = db.prepare('INSERT INTO flashcards (deck_id, front, back, difficulty) VALUES (?, ?, ?, ?)');
    seedData.flashcards.forEach(c => insertCard.run(c.deck_id, c.front, c.back, c.difficulty));

    const insertCase = db.prepare('INSERT INTO case_scenarios (id, title, client_profile, presenting_concern, difficulty, category) VALUES (?, ?, ?, ?, ?, ?)');
    seedData.case_scenarios.forEach(c => insertCase.run(c.id, c.title, c.client_profile, c.presenting_concern, c.difficulty, c.category));

    const insertOsce = db.prepare('INSERT INTO osce_questions (id, scenario, question, model_answer, category, difficulty) VALUES (?, ?, ?, ?, ?, ?)');
    seedData.osce_questions.forEach(q => insertOsce.run(q.id, q.scenario, q.question, q.model_answer, q.category, q.difficulty));

    const insertSkill = db.prepare('INSERT INTO skills_scenarios (id, skill_name, scenario_text, correct_response, explanation) VALUES (?, ?, ?, ?, ?)');
    seedData.skills_scenarios.forEach(s => insertSkill.run(s.id, s.skill_name, s.scenario_text, s.correct_response, s.explanation));

    console.log('  Database seeded successfully.');
  }
}

module.exports = { seedIfEmpty, seedData };