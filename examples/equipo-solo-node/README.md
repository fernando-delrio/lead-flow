# Equipo Solo Node.js example

[English](README.md) · [Español](README.es.md)

A deliberately small project for observing the workflow without letting the domain or dependencies
hide what matters.

## Initial state

The cart charges `€4.99` for shipping when it contains products. There are no discounts, taxes,
or persistence.

```bash
npm test
npm run lint
npm run build
```

All three commands must complete successfully without installing dependencies.

## Demonstration task

Open Claude Code in this directory and paste:

```text
Read AGENTS.md and CLAUDE.md. Add free shipping when the subtotal is 50 euros or more.
Include the exact 50-euro boundary, keep shipping at 4.99 euros below it, and do not use Git.
Use the agent workflow and stop after closing the increment.
```

## Verifiable outcome

- An empty cart pays no shipping.
- At a subtotal of `€49.99`, shipping costs `€4.99`.
- At a subtotal of `€50.00`, shipping is free.
- Above a subtotal of `€50.00`, shipping is free.
- Tests, lint, and build pass.

The point of the demonstration is not the difficulty of the change. It is seeing who plans, who
implements, what gets checked, and who reviews before the increment is closed.
