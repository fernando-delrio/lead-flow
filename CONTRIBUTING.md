# Contributing to lead-flow

[English](CONTRIBUTING.md) · [Español](CONTRIBUTING.es.md)

Thank you for giving your time to the project. `lead-flow` is under construction: a useful
contribution does not need to be large, but it must leave a result that someone else can verify.

GitHub is the canonical home. Use its issues and pull requests to propose changes. GitLab is a
mirror and is not used to develop a separate history.

## Before you start

1. Look for an open issue labelled `good first issue` or `help wanted`.
2. Leave a comment to confirm that you intend to work on it.
3. If the change affects behaviour or design, agree on the scope in the issue first.

If there is no suitable task yet, open a proposal and wait until its scope is clear before starting
a large change.

You may open a small documentation fix directly. Do not include credentials, client data, or
vulnerability details in a public issue; for the latter, read [`SECURITY.md`](SECURITY.md).

## Set up the project

You need Git and Node.js 20 or later.

```bash
git clone https://github.com/fernando-delrio/lead-flow.git
cd lead-flow/cli
npm ci
npm test
npm run lint
npm run build
```

If these checks fail before you change anything, open an issue with your operating system, Node.js
version, and the complete command output.

## Make a change

- Create a branch from `main`: `feat/<topic>`, `fix/<topic>`, or `docs/<topic>`.
- Keep each pull request focused on one problem.
- Add tests when behaviour changes.
- Update the documentation when you change what a person installs, runs, or decides.
- Do not include `node_modules/` or `cli/dist/`.
- Explain what changes, why it changes, and how you verified it.

Public-facing project text is written in English, with Spanish translations where they are useful.
Code uses English names. Current technical decisions live in
[`specs/001-control-del-lead/`](specs/001-control-del-lead/); these internal design records are
still in Spanish.

## Submit a pull request

Before opening it, run from `cli/`:

```bash
npm test
npm run lint
npm run build
```

The pull request must link its issue, describe the checks you ran, and declare anything still
pending. A maintainer will review the scope, tests, security, and consistency with the design
before merging it.

By participating, you agree to [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) and to publish your
contribution under the repository's Apache 2.0 license.
