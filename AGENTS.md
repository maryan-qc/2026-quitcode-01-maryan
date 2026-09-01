# AGENTS.md

Baseline guidance for an agentic tool (Claude Code / Cursor) working in **this
homework repo**.

> QuitCode Workshop 1 homework — vibe-coding. The participant scaffolds a small
> Vite app under `app/`, wires up a design system, and vibe-codes a mini app.
> See `docs/walkthrough.md`.

## Context

- This repo starts almost empty on purpose. The participant creates the project
  under `app/` (recommended: Vite + React TS + `@porsche-design-system/components-react`).
- The homework is reviewed by CodeRabbit (`.coderabbit.yaml`) against the
  Definition of Done in `docs/walkthrough.md`.
- This is deliberate vibe-coding: no rules/skills/tests are required in WS1 —
  they arrive later in the course. Keep the ceremony low.

## Conventions

- Documentation language: Ukrainian or English (participant's choice).
- Keep artifacts in the agreed paths so the review finds them:
  - `app/` — the vibe-coded app (`npm run dev` and `npm run build` must work)
  - `docs/vibe-notes.md` — Task 3 (what worked, where the agent stumbled,
    REAL token/cost numbers, 2–3 observations)
  - `docs/ab-experiment.md` — Task 4 (bonus, prompt A/B)
- Build the UI from design-system components (default: Porsche Design System —
  wrap the app in `PorscheDesignSystemProvider`, use `P*` components), not from
  hand-rolled CSS.
- Commit after each successful iteration — commits are the save points of a
  vibe session.

## Guardrails

- **NEVER** commit secrets, API keys, or `.env` files. They are gitignored —
  keep it that way.
- Do not modify `.coderabbit.yaml` or `.github/` — they are the assignment's
  checker, not the solution.
- **Windows + Git Bash:** never use `2>nul` / `>nul` (creates a literal `nul`
  file). Use `2>/dev/null` / `>/dev/null`. `nul` is gitignored as a net.

## How to verify

Before opening a PR: `npm run dev` shows the app, `npm run build` passes,
`docs/vibe-notes.md` exists with real numbers (not placeholders).
