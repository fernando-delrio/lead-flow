# AGENTS.md — <Project name>

Keep this entry point short (target: 60-100 lines). Detailed rules live in `doc/` and are loaded
only when relevant. If it grows beyond 120 lines, move detail to `doc/` and leave a rule and link.

**What it is:** <product, audience, and status in one sentence>.
**Completion check:** Would I put this in front of the client now without a warning? If the answer
is “yes, but…”, it is not finished.

## Stack and commands
- Frontend: <stack>. Backend: <stack>. Database: <development and production engines>.
- Start: `<backend command>` · `<frontend command>`.
- **Verify:** `<backend tests>` · `<backend lint>` · `<frontend tests>` · `<frontend lint>` · `<build>`.
- Dependencies: `<pip-audit>` · `<npm audit --audit-level=high>`.

## Structure
- <Module, layer, and dependency rules>.
- Before creating a file: identify its owner, layer, production/test role, and consumers.

## Code rules
- <5-8 concrete, verifiable rules>.
- Enforce mechanically verifiable rules with tests or lint, not prose alone.

## Domain red lines
- <What must never be said or done, and which test enforces it>.

## Security
- <Parameterized queries, secrets outside code, authentication, CORS…>.

## Working method
- Build small end-to-end increments. Write the test before logic.
- **Git belongs to the person:** agents propose commands and never execute them.
- After one increment: stop, summarize, and wait for approval.
- Write the spec first, then the plan, tasks, and code.

## Boundaries
- ✅ Always: read before editing and run affected checks.
- ⚠️ Ask first: dependencies, applied migrations, and deployment configuration.
- 🚫 Never: Git writes, credentials in code, or claiming an unexecuted check passed.

## Completion checks
Tests and lint pass, documentation is current, and the diff is small. Run the relevant
`puerta-seguridad`, `puerta-rendimiento`, and `revisor-diseno` agents in parallel;
`cierre-incremento` confirms what remains.

## Read X when changing Y
| When changing… | Read |
|---|---|
| <topic> | `doc/<file>.md` |
