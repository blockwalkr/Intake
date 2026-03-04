# IPS Client Intake Questionnaire

A multi-client Investment Policy Statement intake tool built with **Vite + React** and a local **Node.js JSON-file API**. Designed for investment advisor representatives to collect structured client data and export it in a format optimized for LLM-assisted IPS document generation.

## Quick Start

```bash
npm install
npm run dev
```

This starts both the API server (`localhost:3001`) and the Vite dev server (`localhost:5173`) concurrently. Open [http://localhost:5173](http://localhost:5173).

You can also run them separately:

```bash
npm run dev:server   # API only
npm run dev:client   # Vite only
```

## Architecture

```
ips-questionnaire/
├── server/
│   └── index.js              # Node.js HTTP server (no dependencies)
├── data/
│   ├── clients.json          # Client index (auto-created)
│   └── clients/              # Per-client JSON files (auto-created)
├── src/
│   ├── main.jsx              # Entry point + font imports
│   ├── index.css             # Global reset
│   ├── App.jsx               # Main app — client mgmt, sidebar, layout
│   ├── components.jsx        # Reusable UI — inputs, questions, sections
│   ├── questions.js          # All 54 questions as data
│   └── storage.js            # API client + answer detection + LLM export
├── index.html
├── vite.config.js            # Dev proxy /api → :3001
└── package.json
```

### API Server

Zero-dependency Node.js HTTP server that stores data as JSON files on disk:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/clients` | List all clients |
| `POST` | `/api/clients` | Create a client `{ name }` |
| `GET` | `/api/clients/:id` | Get client questionnaire data |
| `PUT` | `/api/clients/:id` | Update client data (auto-save) |
| `DELETE` | `/api/clients/:id` | Delete a client |

Client data is saved to `data/clients/<id>.json`. The client index is `data/clients.json`. Both are gitignored (except the empty index).

### Frontend

| File | Responsibility |
|------|----------------|
| `questions.js` | 54 questions across 10 IPS sections — edit here to customize |
| `storage.js` | `fetch`-based API client, `isAnswered()` utility, LLM export builder |
| `components.jsx` | AutoTextarea, QuestionBlock (5 input types), SectionCard, Toast, Icons |
| `App.jsx` | Client CRUD, sidebar, top bar, progress tracking, export buttons |

## Features

- **Multi-client management** — create, search, switch, delete from sidebar
- **Auto-save** — 800ms debounce, saves to server on every keystroke
- **5 input types** — text, single-select, multi-select, repeating goals, checkbox-with-value
- **Mutual exclusion** — "None" options clear other selections
- **Toggle deselect** — click any selected option again to deselect
- **Progress tracking** — per-section badges + global progress bar
- **Jump to unanswered** — click progress bar to scroll to first incomplete question
- **LLM export** — structured text with all answers + IPS generation prompt
- **JSON export** — raw data for programmatic use
- **Clipboard copy** — one-click copy of the LLM prompt

## Question Types

| Type | Behavior |
|------|----------|
| `text` | Auto-expanding textarea |
| `combo` | Single-select pill buttons (click again to deselect) + optional follow-up text and chips |
| `check` | Multi-select pills with optional `noneOptions` for mutual exclusion |
| `goals` | Repeating Goal / Target Amount / Timeline rows with Add/Remove |
| `checkval` | Checkbox pills that reveal inline dollar-value input when selected |

## Customization

- **Add/remove/edit questions** — modify `src/questions.js`. Each question needs a unique `id`.
- **Change the LLM prompt** — edit `buildLLMExport()` in `src/storage.js`.
- **Swap the backend** — replace the `fetch` calls in `src/storage.js` with your preferred persistence (Supabase, Firebase, PostgreSQL, etc). The API surface is 5 functions.
- **Restyle** — all styling is inline in `components.jsx` and `App.jsx`.

## Production Build

```bash
npm run build     # Outputs to dist/
npm run preview   # Preview the build locally
```

For production, you'll want to serve `dist/` with a static file server and either keep the Node.js API server running or replace it with your backend of choice.
