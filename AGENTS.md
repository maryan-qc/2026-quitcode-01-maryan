# AGENTS.md

Baseline guidance for an agentic tool (Claude Code / Cursor) working in **this
homework repo**.

> QuitCode Workshop 1 homework — greenfield. Participants initialize their own
> small project and complete Tasks 1–4. See `docs/walkthrough.md`.

## Context

- This repo starts almost empty on purpose. The participant creates a new
  TypeScript project under `app/` and writes their own `AGENTS.md` **inside
  that project**.
- `materials/` holds the n8n workflow export + its business rules — that is the
  **spec** for Task 2. Treat `materials/` as read-only input: never edit it.
- The homework is graded by CodeRabbit (`.coderabbit.yaml`) against the
  Definition of Done in `docs/walkthrough.md`.

## Conventions

- Documentation language: Ukrainian or English (participant's choice).
- Keep generated artifacts in the agreed paths so auto-review can find them:
  - `app/` — the new project (logic + vitest tests, `npm test` green)
  - `.agents/skills/` — at least one installed Agent Skill (Task 1)
  - `docs/workflow.md` — Task 2 write-up (modes used, what was adjusted)
  - `docs/cost-analysis.md` — Task 3 (token/cost numbers + findings)
  - `docs/ab-experiment.md` — Task 4 (bonus, prompt A/B)
- External services from the n8n workflow are replaced with local adapters:
  notification → console/log file, spreadsheet → CSV/JSON file under
  `app/data/`.

## Guardrails

- **NEVER** commit secrets, API keys, or `.env` files. They are gitignored —
  keep it that way. In the n8n original, credentials live in the platform; in
  code their place is env vars.
- Keep `node_modules`, builds, and lockfiles out of the AI context
  (`.cursorignore` / `permissions.deny`) — this is literally Task 1.
- Do not modify `materials/`, `.coderabbit.yaml`, or `.github/` — they are the
  assignment, not the solution.
- **Windows + Git Bash:** never use `2>nul` / `>nul` (creates a literal `nul`
  file). Use `2>/dev/null` / `>/dev/null`. `nul` is gitignored as a net.

## How to verify

Before opening a PR: `npm test` in `app/` is green, the migrated logic matches
`materials/workflow-description.md` (validation, budget normalization, hot/cold
segmentation, actions), and the Task files listed above exist with real content
(not placeholders).
