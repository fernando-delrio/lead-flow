# The workflow and why it is built this way

[English](WORKFLOW.md) · [Español](FLUJO.md)

```text
 idea → planificador → revisor (spec) ✋ → planificador (plan + tasks) ✋
      → implementador (ONE task, test first)
      → PARALLEL gates: security · performance · design · style
      → revisor (requirement by requirement)
      → cierre-incremento → ✋ the person commits
```

| Agent | Responsibility | Model | Writes |
|---|---|---|---|
| `planificador` | EARS spec, plan, and tasks | opus | `specs/` only |
| `revisor` | Spec QA and requirement-by-requirement validation | opus | nothing |
| `implementador` | One task, test first | sonnet | code |
| `puerta-seguridad` | Security veto | opus | nothing |
| `puerta-rendimiento` | JS, dependency, image, and route-budget veto | sonnet | nothing |
| `revisor-diseno` | Visual consistency and accessibility | sonnet | nothing |
| `cierre-incremento` | Documentation, tasks, errors, diff size, and commit handoff | sonnet | nothing |

Only one agent writes code. Every agent that judges work is read-only, so it cannot quietly fix
the same work it is supposed to assess.

## Decisions

1. **One writer, several readers.** Independent reviewers report; the person decides.
2. **Parallel gates once per increment.** They are independent. Running them after every edit
   would waste time, tokens, and context.
3. **Model choice follows risk.** Specification and security use the strongest model; a clearly
   planned implementation uses the intermediate model. Sensitive work can opt into opus.
4. **Machines enforce mechanical rules.** Tests, lint, budgets, and permission denies are more
   reliable than prose reminders.
5. **Keep `AGENTS.md` short.** Always-needed rules stay at the entry point; topic detail is loaded
   only when relevant.
6. **Evaluate agent changes.** `evals/` checks known failures and a clean case for false positives.

## Deliberately excluded

- Agent teams: still experimental and substantially more expensive.
- Per-agent memory: it grants write access and breaks the read-only reviewer boundary.
- Extra agents “just in case”: add one only after a repeated real failure.

## Sources

- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Anthropic: How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Claude Code subagents documentation](https://code.claude.com/docs/en/sub-agents)
- [Harness engineering](https://www.ignorance.ai/p/the-emerging-harness-engineering)
