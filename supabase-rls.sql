-- ═══════════════════════════════════════════════════════════════
-- MANASYN v2 — Supabase Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor after creating your project.
-- These policies ensure users can ONLY access their own data.
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all user-data tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_work_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE osce_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- ═══ Users: can only see/update their own row ═══
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ═══ Conversations: owner only ═══
CREATE POLICY "Users can CRUD own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- ═══ Messages: only if user owns the parent conversation ═══
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid())
  );

-- ═══ Reflections: owner only ═══
CREATE POLICY "Users can CRUD own reflections" ON reflections
  FOR ALL USING (auth.uid() = user_id);

-- ═══ Self-work: owner only ═══
CREATE POLICY "Users can CRUD own self-work" ON self_work_exercises
  FOR ALL USING (auth.uid() = user_id);

-- ═══ Journal: owner only ═══
CREATE POLICY "Users can CRUD own journal" ON journal_entries
  FOR ALL USING (auth.uid() = user_id);

-- ═══ Settings: owner only ═══
CREATE POLICY "Users can CRUD own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- ═══ Learning progress: owner only ═══
CREATE POLICY "Users can CRUD own progress" ON learning_progress
  FOR ALL USING (auth.uid() = user_id);

-- ═══ Student tool responses: owner only ═══
CREATE POLICY "Users can CRUD own case responses" ON case_responses
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own osce responses" ON osce_responses
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own skills responses" ON skills_responses
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own flashcard reviews" ON flashcard_reviews
  FOR ALL USING (auth.uid() = user_id);

-- ═══ Public read-only tables (flashcards, cases, questions, scenarios) ═══
-- These are seeded content, not user data. All authenticated users can read.
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE osce_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read decks" ON flashcard_decks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read cards" ON flashcards
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read cases" ON case_scenarios
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read osce" ON osce_questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read skills" ON skills_scenarios
  FOR SELECT TO authenticated USING (true);