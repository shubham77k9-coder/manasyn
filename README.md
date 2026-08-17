# Manasyn — Full-Stack Web Application

> **Support · Reflect · Grow**
> A calm AI wellness + psychology-learning platform.

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or run in dev mode (auto-restart on changes)
npm run dev
```

Then open **http://localhost:3000** in your browser.

The database (SQLite) is created automatically on first run and seeded with flashcards, case scenarios, OSCE questions, and skills scenarios.

## Default Access

Sign up at `/auth/signup` — the app creates your account and logs you in. Choose "Psychology student" or "Psychologist" role to access student tools (Case Coach, OSCE, Skills Lab, Flashcards, Research Helper).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express 4 |
| Database | SQLite (better-sqlite3) |
| Auth | Session-based (express-session + bcryptjs) |
| Views | EJS templates |
| Security | Helmet, rate limiting, session secrets |
| Styling | Custom CSS design system (frozen Manasyn spec) |
| JS | Vanilla JavaScript (no framework) |

## Project Structure

```
manasyn/
├── server.js              # Express server entry point
├── package.json
├── .env                   # Environment variables
├── db/
│   └── database.js        # SQLite schema + connection
├── seeders/
│   └── seed.js            # Seed data (flashcards, cases, OSCE, skills)
├── middleware/
│   └── auth.js            # Auth middleware (requireAuth, requireStudent)
├── routes/
│   ├── index.js           # Marketing pages (landing, safety, about, etc.)
│   ├── auth.js            # Login, signup, onboarding, logout
│   ├── app.js             # Dashboard, talk, reflect, self-work, progress, journal, settings
│   ├── student.js         # Case Coach, OSCE, Skills Lab, Flashcards, Research
│   └── api.js             # AI chat API, crisis resources API
├── views/
│   ├── partials/          # head, navbar, footer, sidebar, mobile-nav
│   ├── auth/              # login, signup, onboarding, forgot-password
│   ├── app/               # dashboard, talk, conversation, reflect, self-work, progress, journal, settings
│   ├── student/           # dashboard, case-coach, osce, skills-lab, flashcards, research
│   ├── pages/             # how-it-works, for-you, for-students, safety, about, pricing, crisis-resources
│   └── errors/            # 404, 500
├── public/
│   ├── css/
│   │   └── style.css      # Complete Manasyn design system
│   └── js/
│       ├── app.js         # Theme toggle, voice, shared utilities
│       └── conversation.js # Conversation chat logic
└── README.md
```

## Features

### Personal Wellbeing
- **AI Conversations** — Rule-based AI that detects emotions, crisis language, and responds with empathy
- **Guided Reflection** — Record emotions, triggers, patterns, and insights
- **Self-Work** — Step-by-step exercises with progress tracking
- **Progress** — Consistency tracking, weekly activity chart, reflection/conversation stats
- **Journal** — Free-form writing with mood tracking
- **Settings** — Account, preferences (theme, notifications, voice, reduced motion), privacy, safety

### Student Tools (requires student/psychologist role)
- **Case Coach** — 5 clinical case scenarios with AI feedback on approach
- **OSCE Viva** — 8 clinical questions with voice input and scored feedback (clinical reasoning, communication, ethics, structure)
- **Skills Lab** — 6 interactive counselling scenarios (active listening, empathy, validation, reframing)
- **Flashcards** — 3 decks, 16 cards covering psychopathology, therapy, and assessment with spaced repetition
- **Research Helper** — Generate research frameworks (question, variables, hypothesis, methodology, measures, search strategy)

### Essential Website Features
- **Crisis Resources** — Public page with India-specific crisis helpline numbers (iCall, AASRA, NIMHANS, Vandrevala)
- **Crisis Detection** — AI detects crisis language and surfaces resources immediately
- **Privacy Controls** — Export all data as JSON, delete account permanently
- **Error Handling** — Custom 404 and 500 error pages with calm messaging
- **Empty States** — Every empty screen has a helpful message and CTA
- **Loading States** — Typing indicator for AI responses
- **Dark Mode** — Full dark theme (not just inverted colors)
- **Reduced Motion** — Respects `prefers-reduced-motion`
- **Responsive** — Works on desktop, tablet, and mobile (bottom tab bar on mobile)
- **Rate Limiting** — API routes protected
- **Security** — Helmet headers, session secrets, bcrypt password hashing

## Design System

The CSS follows the frozen Manasyn design direction:
- **Calm Minimalism** + subtle glassmorphism
- **Soft indigo/lavender accent** (#5B5BD6)
- **Plus Jakarta Sans** (body) + **Instrument Serif** (display)
- Generous whitespace, restrained motion, human-centered typography

## Environment Variables

```
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secret-here
DB_PATH=./db/manasyn.db
```

## License

© 2024 Manasyn. Designed with care. Built with boundaries.