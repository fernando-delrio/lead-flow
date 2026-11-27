# First contribution tasks

[English](primeras-tareas.md) · [Español](primeras-tareas.es.md)

These drafts come from observations already recorded during phase 1 reviews. They do not include
core tasks 12–18, which require the plan's specialised review workflow.

Each section is ready to become a GitHub issue. Before publishing it, create the labels described
in [`etiquetas.md`](etiquetas.md).

## 1. Read decision records with CRLF line endings

**Labels:** `bug`, `testing`, `good first issue`.

`parseRecord` and `parseOptions` split part of the record using only `\n`. A file edited on
Windows may contain `\r\n`, leaving `\r` in values or preventing them from being recognised.

**Scope**

- Add a test that reads a valid record converted to CRLF.
- Normalise or split line endings without changing the format currently written.
- Preserve the existing messages for genuinely invalid records.

**Acceptance**

- The test proves that `listDecisions` returns the same object for LF and CRLF.
- `npm test`, `npm run lint`, and `npm run build` pass from `cli/`.

**Out of scope:** changing the Markdown structure of the records.

**Suggested files:** `cli/src/decisions/records.ts`, `cli/test/decisions/records.test.ts`.

## 2. Show the correct use of `lead-flow cambiar` when the topic is missing

**Labels:** `bug`, `good first issue`.

`lead-flow cambiar` without arguments says that the empty topic does not exist. A person needs to
see the command usage and valid topics, not an error about `“”`.

**Scope**

- Add a test for the command without a topic.
- Show a Spanish usage message, for example `lead-flow cambiar <tema>`, because the CLI remains
  Spanish in phase 1.
- Keep the existing error when an unknown topic is provided.

**Acceptance:** the new test and the complete suite, lint, and build pass.

**Out of scope:** redesigning the CLI's general help.

**Suggested files:** `cli/src/index.ts` and its CLI entry-point tests.

## 3. Lock the conflict behaviour for an existing empty file with a test

**Labels:** `testing`, `good first issue`.

The generator treats any existing file without markers as a conflict, even when it is empty. This
protection is intentional, but no test prevents it from changing by accident.

**Scope**

- Add a case with `current === ''` to the `planWrite` tests.
- Check the status, unchanged content, and conflict explanation.
- Do not change the implementation unless the test reveals a real inconsistency.

**Acceptance:** the new case demonstrates all three expected effects and passes with the full suite.

**Out of scope:** allowing the generator to take ownership of empty files automatically.

**Suggested file:** `cli/test/generate/blocks.test.ts`.

## 4. Include the license and notice in the equipo-solo plugin

**Labels:** `documentation`, `good first issue`.

The repository has `LICENSE` and `NOTICE` at its root, but the `plugin/` directory installed as
`equipo-solo` does not carry those files.

**Scope**

- Determine which files a local marketplace installation includes.
- Add the Apache 2.0 license and corresponding notice inside `plugin/`.
- Avoid maintaining two legal texts that can diverge without a check.

**Acceptance:** a fresh installation makes the license and notice discoverable from the plugin.

**Out of scope:** changing the project license.

## 5. Fix red contrast in the visual story

**Labels:** `accessibility`, `documentation`, `good first issue`.

Red `#ff5555` on panel `#2a2c3a` reaches approximately 4.40:1, below the 4.5:1 minimum for
normal text. The recorded case is `pago ✕`.

**Scope**

- Choose a red that reaches at least 4.5:1 on the panel without losing its visual meaning.
- Change `assets/historia/fuente/generar.mjs` and regenerate the SVG files.
- Document the verified contrast ratio.

**Acceptance:** `node assets/historia/fuente/generar.mjs` reproduces the versioned SVG files and
the affected text reaches at least 4.5:1.

**Out of scope:** redesigning the illustrations or their animations.

## 6. Include tests in type checking

**Labels:** `testing`, `help wanted`.

`cli/tsconfig.json` only includes `src`, so `npm run build` does not type-check files under
`test/**/*.ts`.

**Scope**

- Add type checking for tests without emitting JavaScript for them.
- Only fix type errors discovered by that check.
- Integrate the check into the scripts run by contributors.

**Acceptance:** a deliberate type error in a test fails the check; test, lint, and build remain green.

**Out of scope:** changing style rules or updating dependencies.

## 7. Use commands executable from Node and Laravel projects

**Labels:** `bug`, `documentation`, `good first issue`.

The catalogue suggests `vitest run` for pnpm options and `phpcs` for Laravel. In a typical local
installation, executables live in the project and are invoked with `pnpm exec vitest run` and
`./vendor/bin/phpcs`.

**Scope**

- Update the affected commands and explanations.
- Add or strengthen a content test that checks the exact commands.
- Confirm that the linked documentation supports those invocations.

**Acceptance:** the Express, NestJS, and Laravel options store commands executable from a project
root with dependencies installed; test, lint, and build pass.

**Out of scope:** changing the test framework, linter, or package manager.

**Suggested files:** `catalogo/herramientas/node-express.yml`,
`catalogo/herramientas/node-nestjs.yml`, `catalogo/herramientas/php-laravel.yml`, and
`cli/test/catalog/content.test.ts`.
