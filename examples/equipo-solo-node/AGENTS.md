# AGENTS.md — Demostración de Equipo Solo

**Qué es:** carrito mínimo en Node.js para demostrar un incremento con agentes.
**Pregunta de control:** ¿se puede comprobar el comportamiento con un ejemplo en el límite?

## Stack y comandos

- JavaScript ESM sobre Node.js 22 o posterior, sin dependencias externas.
- Probar: `npm test`.
- Lint: `npm run lint`.
- Build: `npm run build`.

## Estructura

- `src/cart.js`: lógica del carrito.
- `test/cart.test.js`: comportamiento observable.
- No crear nuevas capas ni archivos para esta demostración pequeña.

## Reglas de código

- Nombres de código en inglés; documentación y mensajes en castellano.
- Funciones pequeñas, sin mutar la lista recibida.
- Los importes se expresan en euros con dos decimales en los ejemplos.
- Cada borde del requisito tiene una prueba explícita.

## Forma de trabajar

- Prueba antes que código cuando cambia el comportamiento.
- Git es de la persona: no ejecutar `git add`, `commit` ni `push`.
- Al cerrar el incremento, resumir qué funciona, qué se ha ejecutado y qué queda fuera.

## Límites

- No instalar dependencias.
- No añadir descuentos, impuestos, monedas ni persistencia.
- No afirmar que algo pasa si no se ha ejecutado.
