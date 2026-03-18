# TradeMind AI — Frontend

Premium, AI-first frontend for TradeMind: investor-ready UI with AI Core, chat, and product sections.

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** — dark theme, subtle gradients
- **shadcn-style UI** — Radix primitives + CVA (Button, Card, Badge, Input)
- **framer-motion** — animations, orb states, transitions
- **lucide-react** — icons
- **Zustand** — UI state (sidebar, AI status, chat)

## Run

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Folder structure

```
src/
  app/           # App Router: layout, page, journal, setups, analysis, markets, news, daily-bias, library, settings
  components/    # layout (Sidebar, Header, MainContent), ui (Button, Card, Badge, Input)
  features/      # dashboard (AICore, InsightCards, DecisionContext), chat (ChatPanel)
  lib/           # utils (cn)
  mock/          # types + mock data (decisions, errors, news, daily bias, setups, markets)
  store/         # useUIStore, useChatStore
```

## API endpoints to plug later

When the backend is online, wire these:

| Method | Endpoint | Purpose |
|--------|----------|--------|
| GET | `/api/v1/health` | Health check (used for API: online/offline badge) |
| POST | `/api/v1/analyze` | Send decision text; get AI insight (pattern, evidence, rule) |
| GET | `/api/v1/decisions` | List decisions (journal) |
| GET | `/api/v1/decisions/{id}` | Single decision |
| GET | `/api/v1/decisions/{id}/insight` | AI insight for a decision |

- **Health**: call `GET /api/v1/health` on load or interval; update `useUIStore.apiOnline`.
- **Analyze**: on chat send, `POST /api/v1/analyze` with `{ "text": "..." }`; stream or display the response (pattern, evidence, repetition, impact, next rule).
- **Decisions**: replace `mockDecisions` and localStorage in Journal with `GET /api/v1/decisions` and persist new entries via your backend API.

## Mock data

- **Journal**: new entries are stored in `localStorage` under `trademind_decisions` for a demo feel.
- **Dashboard**: Insight Cards and Decision Context use static mock data; chat uses a mock typing response.
- **Analysis, Markets, News, Daily Bias, Library**: all use `src/mock/*.ts`; swap for API when ready.
