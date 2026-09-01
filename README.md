# QuitCode Workshop 1 — Homework (greenfield)

Starter repo for the first homework of the QuitCode **"Modern Development with
Agentic AI"** course.

> Workshop 1: **Сучасний стан агентної інженерії. Від no-code до AI-розробки**
> Автор: В'ячеслав Колдовський — Dev AI Consulting (dev-ai.dev)

This is a **greenfield** exercise: you initialize your **own** small TypeScript
project inside your fork, configure your agentic tooling, migrate a small n8n
workflow to code with AI, and analyze the token/cost footprint. ~1–2 hours.

## Quick start

```bash
gh repo fork koldovsky/2026-quitcode-01-agentic-engineering-hw --clone
cd 2026-quitcode-01-agentic-engineering-hw
git checkout -b ws01/<github-username>
# follow docs/walkthrough.md
gh pr create --title "WS1: <your name>" --fill
```

Full step-by-step instructions: [`docs/walkthrough.md`](docs/walkthrough.md).

## What's in here

| File | Purpose |
|---|---|
| `docs/walkthrough.md` | Step-by-step: setup, Task 1–4, Definition of Done |
| `materials/n8n-lead-intake.workflow.json` | Real n8n export of the training workflow you migrate in Task 2 |
| `materials/workflow-description.md` | The workflow's business rules — your migration spec |
| `.github/pull_request_template.md` | PR checklist (auto-applied) |
| `.coderabbit.yaml` | CodeRabbit auto-review tuned to this homework's DoD |
| `AGENTS.md` | Baseline guidance for your agentic tool in this repo |

You create everything else (`app/`, `AGENTS.md` inside it, `docs/*`) yourself —
that's the homework. This repo is also used for the **live demo** during the
workshop; the open PR `ws01/koldovsky-demo` is the reference solution.

## Tools

Claude Code / Cursor (at least one) + a GitHub account + Node 22+.
Questions → the course chat (feedback within 2 weeks after the final workshop).
