# Equipo Solo 0.1.0

[English](equipo-solo-v0.1.0.md) · [Español](equipo-solo-v0.1.0.es.md)

The first public release of the `equipo-solo` plugin for Claude Code.

## What it includes

- A planner and implementer with separate responsibilities.
- A reviewer independent from the implementer.
- Security and performance gates.
- Design review for visual changes.
- Increment closure that checks tests, documentation, and pending work.
- Templates for bringing a project's real rules into the agents.

## Install

```bash
claude plugin marketplace add fernando-delrio/lead-flow
claude plugin install equipo-solo@equipo-solo
claude plugin details equipo-solo@equipo-solo
```

## Verification performed

- `claude plugin validate ./plugin --strict`: passed.
- `claude plugin validate . --strict`: marketplace valid.
- Installation from `fernando-delrio/lead-flow` in an isolated temporary configuration: version
  `0.1.0`, plugin active, and seven agents loaded.
- CLI suite: 221 tests, lint, and build passed before the release was prepared.

## Try the workflow

Follow [`examples/equipo-solo-node/README.md`](../../examples/equipo-solo-node/README.md). The
example only uses Node.js and installs no dependencies.

## Video

The public presentation is available at
[`assets/releases/equipo-solo-v0.1.0.mp4`](../../assets/releases/equipo-solo-v0.1.0.mp4).
It is 68.60 seconds long and includes a Spanish (Spain) voice-over, Spanish on-screen text, original
music, and Spanish subtitles. The video remains intentionally in Spanish.
The reproducible project lives in
[`video/equipo-solo-v0.1.0/`](../../video/equipo-solo-v0.1.0/).

## What it does not include

This release does not publish the `lead-flow` CLI, its GitHub gates, or the team workflow. Those
pieces remain in phase 1 inside the same repository.

## Tag

The proposed tag is `equipo-solo-v0.1.0`. It is only created after this increment has been merged
and verified again on `main`.
