---
max_turns: 8
allowed_tools: [Agent, Read, Glob, Grep]
---

Use `equipo-solo:cierre-incremento`. There is no repository: use this description and mark what
you cannot inspect as unverified.

The finished increment adds an orders module: 240 backend lines, 190 frontend lines, and a new
`orders.status` migration with `upgrade()` only. It also fixes a totals rounding bug and adds a
regression test. Nothing in `doc/`, `tasks.md`, or the error log changed. The intended commit is
"various order changes and fixes". Return the agent report unchanged.
