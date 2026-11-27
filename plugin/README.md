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
2. Copy `CLAUDE.template.md` as `CLAUDE.md`. Spanish templates use the `.es.md` suffix.
3. Replace the placeholders, especially the real test, lint, and build commands.
4. Open a new Claude Code session and run `/agents`.

Agent identifiers remain in Spanish for compatibility with version 0.1.0, but their descriptions
and instructions are in English. Agents answer in the language used by the person invoking them.

The complete workflow and the reason for each responsibility are documented in
[`doc/WORKFLOW.md`](doc/WORKFLOW.md). A demonstration project is available at
[`examples/equipo-solo-node/`](https://github.com/fernando-delrio/lead-flow/tree/main/examples/equipo-solo-node).

Tried the plugin? [Share what happened](https://github.com/fernando-delrio/lead-flow/issues/new?template=pilot.yml)
or pick a [`good first issue`](https://github.com/fernando-delrio/lead-flow/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22good%20first%20issue%22).

## Limits

- Agents help apply the workflow; they do not replace tests or human review.
- Git remains in the person's hands: agents propose commands but do not publish changes.
- Each agent adds context and usage when invoked. `claude plugin details` shows an estimate for
  the installed version.
- `lead-flow`, the workflow for teams, is still under construction and is not part of this release.
