# Equipo Solo

[English](README.md) · [Español](README.es.md)

A Claude Code plugin for one person building a full-stack project without a permanent review team.
It brings together seven agents with separate responsibilities: planning, implementation, review,
security, performance and design checks, and increment closure.

## Install

```bash
claude plugin marketplace add fernando-delrio/lead-flow
claude plugin install equipo-solo@equipo-solo
```

Check the installation:

```bash
claude plugin details equipo-solo@equipo-solo
```

The output must show version `0.1.0` and seven agents.

## Prepare a project

1. Copy `AGENTS.template.md` to the project root as `AGENTS.md`.
2. Copy `CLAUDE.template.md` as `CLAUDE.md`.
3. Replace the placeholders, especially the real test, lint, and build commands.
4. Open a new Claude Code session and run `/agents`.

The complete workflow and the reason for each responsibility are documented in
[`doc/FLUJO.md`](doc/FLUJO.md), currently in Spanish. A demonstration project is available at
[`examples/equipo-solo-node/`](https://github.com/fernando-delrio/lead-flow/tree/main/examples/equipo-solo-node).

## Limits

- Agents help apply the workflow; they do not replace tests or human review.
- Git remains in the person's hands: agents propose commands but do not publish changes.
- Each agent adds context and usage when invoked. `claude plugin details` shows an estimate for
  the installed version.
- `lead-flow`, the workflow for teams, is still under construction and is not part of this release.
