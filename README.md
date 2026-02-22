# IPS Client Intake Questionnaire

A React-based multi-client Investment Policy Statement (IPS) intake tool. Designed for investment advisor representatives to collect structured client data and export it in a format optimized for LLM-assisted IPS document generation.

## Features

- **Multi-client management** — Create, search, switch between, and delete clients from a sidebar
- **Persistent storage** — All data auto-saves and persists across sessions
- **54 structured questions** across 10 sections following the standard IPS framework
- **Smart input types** — Free text (auto-expanding), single-select radios, multi-select checkboxes, repeating goal rows, and checkbox-with-value inputs for account balances
- **Mutual exclusion** — "None" options automatically clear other selections
- **Toggle deselect** — Click any selected option again to deselect it
- **Progress tracking** — Per-section completion badges and a global progress bar
- **Jump to unanswered** — Click the progress bar to scroll to the first incomplete question
- **LLM export** — One-click export generates a structured text file with all client answers plus a detailed IPS generation prompt, ready to paste into Claude or any LLM
- **JSON export** — Raw data export for programmatic use

## Project Structure

```
src/
├── questions.js    # All 54 questions organized by section
├── storage.js      # Persistent storage helpers + LLM export builder
├── components.jsx  # Reusable UI: AutoTextarea, QuestionBlock, SectionCard, Toast, Icons
└── App.jsx         # Main app: client management, sidebar, top bar, content
```

## Question Types

| Type | Behavior |
|------|----------|
| `text` | Auto-expanding textarea |
| `combo` | Single-select pill buttons (click again to deselect) with optional follow-up text and follow-up checkboxes |
| `check` | Multi-select pill buttons with optional `noneOptions` for mutual exclusion |
| `goals` | Repeating rows of Goal / Target Amount / Timeline with Add/Remove |
| `checkval` | Checkbox pills that reveal an inline dollar value input when selected |

## LLM Export Format

The export produces a two-part text file:

1. **Client intake data** — All 54 questions with structured answers (selections, free text, goals, account balances). Unanswered items are flagged as `[NO RESPONSE PROVIDED]`.

2. **IPS generation instructions** — A detailed prompt directing the LLM to produce a 10-section IPS document: Executive Summary, Investor Profile, Investment Objectives (Return + Risk), Constraints (Time Horizon, Liquidity, Tax, Legal, Unique), Asset Allocation, Rebalancing, Benchmarks, Monitoring, Roles & Responsibilities, and Signatures.

## Usage

This is a React component that uses:
- `window.storage` API for persistence (available in Claude artifacts)
- Google Fonts: DM Sans + Fraunces
- Tailwind-compatible inline styles (no build step required)

To use outside of Claude artifacts, replace `window.storage` calls in `storage.js` with your preferred persistence layer (localStorage, a database, etc.).

## Customization

- **Add/remove/edit questions**: Modify `src/questions.js`. Each question needs a unique `id`.
- **Change the LLM prompt**: Edit `buildLLMExport()` in `src/storage.js`.
- **Restyle**: All styling is inline in `src/components.jsx` and `src/App.jsx`.
