const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', process.env.DB_PATH || './db/manasyn.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'personal' CHECK(role IN ('personal','student','psychologist')),
  onboarding_complete INTEGER DEFAULT 0,
  onboarding_intent TEXT,
  onboarding_focus TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT DEFAULT 'Untitled conversation',
  mood TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  conversation_id INTEGER,
  emotion TEXT,
  trigger TEXT,
  pattern TEXT,
  insight TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS self_work_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  step_number INTEGER,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed')),
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flashcard_decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS flashcards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id INTEGER NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
  FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  flashcard_id INTEGER NOT NULL,
  rating TEXT CHECK(rating IN ('again','hard','good','easy')),
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS case_scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  client_profile TEXT,
  presenting_concern TEXT,
  difficulty TEXT DEFAULT 'intermediate',
  category TEXT
);

CREATE TABLE IF NOT EXISTS case_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  case_id INTEGER NOT NULL,
  action_type TEXT,
  response_text TEXT,
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES case_scenarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS osce_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario TEXT NOT NULL,
  question TEXT NOT NULL,
  model_answer TEXT,
  category TEXT,
  difficulty TEXT DEFAULT 'medium'
);

CREATE TABLE IF NOT EXISTS osce_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  user_answer TEXT,
  clinical_reasoning INTEGER DEFAULT 0,
  communication INTEGER DEFAULT 0,
  ethics INTEGER DEFAULT 0,
  structure INTEGER DEFAULT 0,
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES osce_questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills_scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_name TEXT NOT NULL,
  scenario_text TEXT NOT NULL,
  correct_response TEXT,
  explanation TEXT
);

CREATE TABLE IF NOT EXISTS skills_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  scenario_id INTEGER NOT NULL,
  chosen_option TEXT,
  is_correct INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (scenario_id) REFERENCES skills_scenarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learning_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  progress_percent INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, category)
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY,
  theme TEXT DEFAULT 'light' CHECK(theme IN ('light','dark')),
  notifications_enabled INTEGER DEFAULT 1,
  voice_responses INTEGER DEFAULT 0,
  reduced_motion INTEGER DEFAULT 0,
  language TEXT DEFAULT 'en',
  crisis_country TEXT DEFAULT 'IN',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_store (
  sid TEXT PRIMARY KEY,
  expired INTEGER,
  sess TEXT
);
`);

module.exports = db;