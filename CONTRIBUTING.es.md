# Contribuir a lead-flow

[English](CONTRIBUTING.md) · [Español](CONTRIBUTING.es.md)

Gracias por dedicar tiempo al proyecto. `lead-flow` está en construcción: una contribución útil
no tiene que ser grande, pero sí debe dejar un resultado que otra persona pueda comprobar.

GitHub es la sede canónica. Usa sus incidencias y pull requests para proponer cambios. GitLab es
un espejo y no se utiliza para desarrollar una historia paralela.

## Antes de empezar

1. Busca una incidencia abierta con `good first issue` o `help wanted`.
2. Escribe un comentario para confirmar que vas a trabajar en ella.
3. Si el cambio altera el comportamiento o el diseño, acuerda primero el alcance en la incidencia.

Si todavía no hay una tarea adecuada, abre una propuesta y espera a concretar su alcance antes de
empezar un cambio grande.

Una corrección pequeña de documentación puede abrirse directamente. No incluyas credenciales,
datos de clientes ni detalles de una vulnerabilidad en una incidencia pública; para esto último,
consulta [`SECURITY.es.md`](SECURITY.es.md).

## Preparar el proyecto

Necesitas Git y Node.js 20 o posterior.

```bash
git clone https://github.com/fernando-delrio/lead-flow.git
cd lead-flow/cli
npm ci
npm test
npm run lint
npm run build
```

Si estas comprobaciones no pasan antes de cambiar nada, abre una incidencia con el sistema
operativo, la versión de Node.js y la salida completa del comando.

## Hacer un cambio

- Crea una rama desde `main`: `feat/<tema>`, `fix/<tema>` o `docs/<tema>`.
- Mantén cada pull request centrada en un solo problema.
- Añade pruebas cuando cambie el comportamiento.
- Actualiza la documentación si cambia lo que una persona instala, ejecuta o decide.
- No incluyas `node_modules/` ni `cli/dist/`.
- Explica qué cambia, por qué y cómo lo has comprobado.

Los textos públicos se escriben en inglés y mantienen traducción al castellano cuando resulta
útil. El código usa nombres en inglés. Las decisiones técnicas actuales están en
[`specs/001-control-del-lead/`](specs/001-control-del-lead/).

## Enviar una pull request

Antes de abrirla, ejecuta desde `cli/`:

```bash
npm test
npm run lint
npm run build
```

La pull request debe enlazar su incidencia, describir las comprobaciones ejecutadas y declarar
cualquier parte pendiente. Una persona mantenedora revisará el alcance, las pruebas, la seguridad
y la coherencia con el diseño antes de integrar el cambio.

Al participar aceptas el [`CODE_OF_CONDUCT.es.md`](CODE_OF_CONDUCT.es.md) y que tu contribución se
publique con la licencia Apache 2.0 del repositorio.
