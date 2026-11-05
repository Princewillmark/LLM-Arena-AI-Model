# LLM Arena — Firebase-First Architecture

Real-time multi-model AI comparison arena and benchmark suite. Allows users to race up to three frontier AI models simultaneously with independent streaming, blind evaluation, dynamic Elo updates, latency telemetry, and crowdsourced leaderboards.

---

## 1. Technology Stack

- **Frontend & Framework:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons.
- **Backend & Middleware:** Node.js, Express, Server-Sent Events (SSE) streaming engine.
- **Authentication:** Firebase Authentication (Google OAuth, Email/Password, persistent sessions).
- **Primary Database:** Firebase SQL Connect backed by Cloud SQL for PostgreSQL (relational schema, GraphQL connector).
- **Bot & Abuse Mitigation:** Firebase App Check attestation + sliding-window rate limiting (20 req/min, 4,000 character prompt constraint).
- **Product Telemetry:** Firebase Analytics event pipeline (replacing PostHog).
- **AI Gateway:** OpenRouter multi-provider API + Google GenAI SDK.
- **Hosting & Deployment:** Firebase App Hosting / Cloud Run.

---

## 2. Architecture & Directory Structure

```
├── firebase/
│   └── dataconnect/
│       ├── dataconnect.yaml            # Firebase SQL Connect service specification
│       ├── schema/
│       │   └── schema.gql              # Relational schema (Users, Competitions, Votes, Stats)
│       └── connector/
│           ├── connector.yaml          # JavaScript SDK output target
│           ├── queries.gql             # Typed GraphQL queries
│           └── mutations.gql           # Typed GraphQL mutations
├── server/
│   ├── arena-engine.ts                 # Concurrent multi-model streaming & telemetry
│   ├── db.ts                           # Relational store mirroring Cloud SQL
│   └── middleware.ts                   # Sliding-window rate limiter & App Check verification
├── src/
│   ├── components/
│   │   ├── ArenaView.tsx               # Simultaneous racing panels, blind voting, reveal
│   │   ├── LeaderboardView.tsx         # Elo ratings, category filters, podium cards
│   │   ├── PromptLibraryView.tsx       # Standard benchmark suites & custom prompts
│   │   ├── HistoryView.tsx             # Authenticated user battle history
│   │   ├── TelemetryView.tsx           # Firebase Analytics & architecture monitor
│   │   ├── Header.tsx                  # Navigation & connection badges
│   │   └── AuthModal.tsx               # Firebase Auth sign-in / registration
│   ├── context/
│   │   └── AuthContext.tsx             # Auth provider with persistent sessions
│   ├── lib/
│   │   └── firebase.ts                 # Firebase client SDK initialization
│   ├── types/
│   │   └── arena.ts                    # TypeScript domain interfaces
│   ├── App.tsx                         # Root application assembly
│   └── main.tsx                        # Client entry point
└── server.ts                           # Full-stack server with Vite middleware & SSE
```

---

## 3. Environment Configuration

Define client and server secrets in your environment:

```bash
# Firebase Client SDK Configuration (Public)
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="llm-arena.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="llm-arena"
VITE_FIREBASE_APP_ID="1:...:web:..."
VITE_FIREBASE_MEASUREMENT_ID="G-..."

# Server-Only Secrets (Never exposed to frontend)
OPENROUTER_API_KEY="sk-or-v1-..."
GEMINI_API_KEY="AIzaSy..."
APP_URL="https://llm-arena.run.app"
```

---

## 4. Key Features

1. **Multi-Model Racing:** Race 1, 2, or 3 models simultaneously (Claude 3.5 Sonnet, GPT-4o, Gemini 3.1 Pro, Gemini 3.8 Flash, DeepSeek V3, DeepSeek R1, Llama 3.3 70B, Mistral Large 2).
2. **Blind Voting & Celebratory Reveal:** Responses are labeled `Model A`, `Model B`, and `Model C`. True identities are unmasked only after the user casts a blind vote, accompanied by celebratory confetti and Elo point adjustments.
3. **High-Precision Telemetry:** Measures exact Time-to-First-Token (TTFT in milliseconds), overall generation duration, tokens/second throughput, and token cost based on live pricing catalogs.
4. **Public Leaderboard:** Crowdsourced Elo scores with category filtering across Coding, Reasoning, Mathematics, Writing, Research, Business, and General benchmarks.
5. **Prompt Library:** Pre-seeded with adversarial prompts plus custom user prompt management stored in Cloud SQL.
6. **Firebase Analytics & App Check:** Real-time event streaming for product metrics and token attestation against abuse.

---

## 5. Development & Testing

```bash
# Install dependencies
npm install

# Start local full-stack server
npm run dev

# Run TypeScript type check
npm run lint

# Build production bundle
npm run build
```
