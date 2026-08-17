# ═══════════════════════════════════════════════════════════════
# MANASYN v2 — HONEST LIMITATIONS DOCUMENT
# What this system can and cannot do. Read carefully.
# ═══════════════════════════════════════════════════════════════

## Security Limitations

### What IS protected:
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ Session-based auth with HTTP-only, SameSite=Strict cookies
- ✅ Role enforcement is SERVER-SIDE — changing role in DevTools does nothing
- ✅ Resource ownership verified server-side on every API call
- ✅ CSRF tokens on all state-changing requests
- ✅ Rate limiting (200 req/15min general, 10 req/15min auth)
- ✅ Helmet security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- ✅ Supabase Row Level Security (RLS) policies — users can only read their own data
- ✅ Service role key NEVER in frontend code
- ✅ Single-session enforcement (when Supabase configured)
- ✅ Clickjacking prevention (X-Frame-Options: DENY)

### What is NOT "impossible to hack":
- ❌ No system is "impossible to hack." Any developer who claims this is lying.
- ❌ DDoS attacks — rate limiting helps but doesn't fully prevent volumetric attacks
- ❌ Zero-day vulnerabilities in Node.js, Express, or dependencies
- ❌ Supply chain attacks (compromised npm packages)
- ❌ Session fixation attacks (mitigated but not eliminated)
- ❌ Brute force on passwords (rate limited to 10 attempts/15min, but not CAPTCHA'd)
- ❌ If someone steals your session cookie (via XSS or network interception), they can impersonate you until the cookie expires (7 days)
- ❌ The AI is rule-based, not a real LLM. It can be tricked or produce nonsensical responses.

### For production-grade security, you would additionally need:
- A real WAF (Web Application Firewall) like Cloudflare's
- CAPTCHA on login/signup (hCaptcha or Cloudflare Turnstile)
- Content Security Policy violation reporting
- Regular dependency auditing (`npm audit`, Snyk, Dependabot)
- HTTPS certificate pinning for mobile apps
- A real database (PostgreSQL via Supabase, not SQLite)
- A real LLM API (OpenAI, Anthropic) with proper guardrails
- Server-side input validation/sanitization on every field (currently basic)
- A bug bounty program
- Regular penetration testing

---

## Architecture Limitations

### Authentication:
- The current code uses Express sessions + bcrypt. Supabase auth is CONFIGURED but requires you to:
  1. Create a Supabase project at supabase.com
  2. Set the env vars (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
  3. Run supabase-rls.sql in the Supabase SQL editor
  4. The code falls back to session auth if Supabase isn't configured

### Single-Session:
- Implemented via in-memory Map. This means:
  - If the server restarts, all sessions are "forgotten" — users need to log in again
  - In a multi-server deployment, you'd need Redis or Supabase's session table instead
  - The current implementation tracks one active session per user

### Database:
- SQLite is used for development. For production:
  - Switch to PostgreSQL (Supabase provides this)
  - SQLite doesn't handle concurrent writes well
  - SQLite file is lost if the server/container is destroyed (unless persistent disk is configured)

### AI Engine:
- The AI is rule-based (pattern matching), NOT a real LLM
- It detects keywords and responds with pre-written empathetic responses
- For a real product, you'd integrate OpenAI/Anthropic/Claude API
- The responses are varied (hash-based selection) to feel less robotic
- Crisis detection works via regex — a real system would need NLP

### Frontend/Backend Split:
- Currently a monolith (Express serves both API and EJS views)
- For a true Cloudflare Pages + Render split:
  - Frontend would be a static SPA (React/Next.js/Vue)
  - Backend would be a pure API server
  - The current architecture has EJS views + static assets — Cloudflare can serve the static files, but views are server-rendered
  - A full refactor to SPA would be needed for true separation

---

## What I Could NOT Build in This Sandbox

1. **Real Supabase integration** — I can write the code, but I can't create a Supabase project for you. You need to sign up, create a project, and set the env vars.

2. **Real Cloudflare deployment** — I can write the config files, but I can't deploy to Cloudflare. You need a Cloudflare account.

3. **Real Render deployment** — Same. You need a Render account and need to connect your repo.

4. **Real LLM API** — The AI engine is rule-based. Integrating OpenAI/Anthropic requires API keys that I don't have.

5. **A real SPA frontend** — The current frontend uses EJS server-rendered views. A true Cloudflare Pages deployment would need a separate React/Vue/Next.js frontend that calls the API. That's a full project refactor.

6. **CAPTCHA** — Would need hCaptcha or Cloudflare Turnstile integration with API keys.

7. **Real-time features** — WebSocket support for live conversation streaming would need Socket.io or similar. Not implemented.

8. **Email sending** — Password reset emails, welcome emails — would need an email service (Resend, SendGrid, AWS SES).

9. **File uploads** — Profile pictures, attachments — would need S3 or Supabase Storage.

10. **Production monitoring** — Sentry, LogRocket, analytics — not included.

---

## Deployment Instructions

### 1. Supabase Setup
```
a. Go to https://supabase.com and create a project
b. Project Settings → API → copy URL, anon key, service role key
c. SQL Editor → run supabase-rls.sql
d. Authentication → Providers → enable Email/Password
```

### 2. Render Setup (Backend)
```
a. Push code to GitHub
b. Go to https://render.com → New → Web Service
c. Connect your GitHub repo
d. Render will auto-detect render.yaml
e. Set env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET
f. Add persistent disk (1GB) at /data for SQLite
g. Deploy
```

### 3. Cloudflare Pages Setup (Frontend - optional, for static assets)
```
a. Go to https://pages.cloudflare.com
b. Connect your GitHub repo
c. Build command: (none needed — static files are in /public)
d. Output directory: public
e. Set env vars: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY
f. Deploy
```

### 4. Local Development
```bash
cd manasyn-enhanced
cp .env.example .env  # Fill in your values
npm install
npm run dev  # Starts on port 4567
```

---

## Tech Stack Summary

| Component | Technology | Production Alternative |
|-----------|-----------|----------------------|
| Backend | Express.js | Same, or serverless functions |
| Database | SQLite | PostgreSQL (via Supabase) |
| Auth | Session + bcrypt | Supabase Auth (code-ready) |
| AI | Rule-based engine | OpenAI/Anthropic API |
| Animations | AOS + custom CSS | Same |
| Frontend | EJS views | React/Next.js SPA |
| Hosting | Local | Render (backend) + Cloudflare (frontend) |
| Security | Helmet + rate limit + CSRF + RLS | + WAF + CAPTCHA |