# CLAUDE.md — <Project name>

@AGENTS.md

Shared rules live in `AGENTS.md`. This file only defines the Claude Code workflow.

```text
planificador → revisor (spec) → approval → planificador (plan and tasks) → approval
  → implementador (one task) → parallel gates → revisor (requirement by requirement)
  → cierre-incremento → the person commits
```

- Launch all relevant gates together when closing an increment. They are read-only.
- Run them once per increment, not after every edit.
- Planning, review, and security use opus; the others use sonnet. The implementer may use opus
  for authentication or sensitive-data work.
