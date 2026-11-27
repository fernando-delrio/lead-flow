# Primeras tareas para colaborar

Estos borradores proceden de observaciones ya registradas durante las revisiones de fase 1. No
incluyen las tareas 12–18 del núcleo, que necesitan el flujo de revisión especializado del plan.

Cada bloque está listo para convertirse en una incidencia de GitHub. Antes de publicarlo se crean
las etiquetas descritas en [`etiquetas.md`](etiquetas.md).

## 1. Leer registros de decisiones con finales de línea CRLF

**Etiquetas:** `bug`, `testing`, `good first issue`.

`parseRecord` y `parseOptions` separan parte del registro únicamente con `\n`. Un archivo editado
en Windows puede contener `\r\n`, por lo que los valores conservan `\r` o dejan de reconocerse.

**Alcance**

- Añadir una prueba que lea un registro válido convertido a CRLF.
- Normalizar o separar los finales de línea sin cambiar el formato que se escribe actualmente.
- Mantener los mismos mensajes para registros realmente inválidos.

**Aceptación**

- La prueba demuestra que `listDecisions` devuelve el mismo objeto con LF y CRLF.
- `npm test`, `npm run lint` y `npm run build` pasan desde `cli/`.

**Fuera:** cambiar la estructura Markdown de los registros.

**Archivos orientativos:** `cli/src/decisions/records.ts`, `cli/test/decisions/records.test.ts`.

## 2. Mostrar el uso correcto de `lead-flow cambiar` cuando falta el tema

**Etiquetas:** `bug`, `good first issue`.

`lead-flow cambiar` sin argumentos responde que el tema vacío no existe. La persona necesita ver
el uso del comando y los temas válidos, no un error sobre `«»`.

**Alcance**

- Añadir una prueba del comando sin tema.
- Mostrar un mensaje de uso en castellano, por ejemplo `lead-flow cambiar <tema>`.
- Mantener el error actual cuando sí se proporciona un tema desconocido.

**Aceptación:** la nueva prueba y toda la suite, lint y build pasan.

**Fuera:** rediseñar la ayuda general del CLI.

**Archivos orientativos:** `cli/src/index.ts` y sus pruebas de entrada del CLI.

## 3. Fijar con una prueba el conflicto de un archivo existente vacío

**Etiquetas:** `testing`, `good first issue`.

El generador considera conflicto cualquier archivo existente sin marcadores, incluso si está
vacío. Esa protección es deliberada, pero no tiene una prueba que impida cambiarla por accidente.

**Alcance**

- Añadir un caso con `current === ''` a las pruebas de `planWrite`.
- Comprobar `estado`, contenido sin modificar y explicación del conflicto.
- No cambiar la implementación salvo que la prueba revele una incoherencia real.

**Aceptación:** el nuevo caso demuestra los tres efectos esperados y pasa con toda la suite.

**Fuera:** permitir que el generador tome posesión automática de archivos vacíos.

**Archivo orientativo:** `cli/test/generate/blocks.test.ts`.

## 4. Incluir la licencia y el aviso en el plugin equipo-solo

**Etiquetas:** `documentation`, `good first issue`.

El repositorio tiene `LICENSE` y `NOTICE` en la raíz, pero el directorio `plugin/` que se instala
como `equipo-solo` no lleva esos archivos consigo.

**Alcance**

- Determinar qué archivos incluye la instalación local del marketplace.
- Incorporar dentro de `plugin/` la licencia Apache 2.0 y el aviso correspondiente.
- Evitar dos textos legales que puedan divergir sin una comprobación.

**Aceptación:** una instalación nueva permite localizar la licencia y el aviso desde el plugin.

**Fuera:** cambiar la licencia del proyecto.

## 5. Corregir el contraste del rojo en la historia visual

**Etiquetas:** `accessibility`, `documentation`, `good first issue`.

El rojo `#ff5555` sobre el panel `#2a2c3a` alcanza aproximadamente 4,40:1, por debajo del mínimo
4,5:1 para texto normal. El caso registrado es `pago ✗`.

**Alcance**

- Elegir un rojo que alcance al menos 4,5:1 sobre el panel sin perder el significado visual.
- Cambiar la fuente `assets/historia/fuente/generar.mjs` y regenerar los SVG.
- Documentar la relación de contraste comprobada.

**Aceptación:** `node assets/historia/fuente/generar.mjs` reproduce los SVG versionados y el texto
afectado cumple 4,5:1 o más.

**Fuera:** rediseñar las ilustraciones o sus animaciones.

## 6. Incluir las pruebas en la comprobación de tipos

**Etiquetas:** `testing`, `help wanted`.

`cli/tsconfig.json` solo incluye `src`, así que `npm run build` no comprueba los tipos de los
archivos `test/**/*.ts`.

**Alcance**

- Añadir una comprobación de tipos para las pruebas sin emitir JavaScript en ellas.
- Corregir únicamente los errores de tipos que esa comprobación descubra.
- Integrar la comprobación en los scripts que ejecuta una persona colaboradora.

**Aceptación:** un error de tipos deliberado en una prueba hace fallar la comprobación; test, lint
y build continúan en verde.

**Fuera:** cambiar las reglas de estilo o actualizar dependencias.

## 7. Usar comandos ejecutables desde proyectos Node y Laravel

**Etiquetas:** `bug`, `documentation`, `good first issue`.

El catálogo propone `vitest run` en opciones que usan pnpm y `phpcs` en Laravel. En una
instalación local habitual, los ejecutables viven en el proyecto y se invocan con
`pnpm exec vitest run` y `./vendor/bin/phpcs`.

**Alcance**

- Actualizar el comando y la explicación en las opciones afectadas.
- Añadir o reforzar una prueba de contenido que compruebe los comandos exactos.
- Revisar que la documentación enlazada respalde las invocaciones.

**Aceptación:** las opciones de Express, NestJS y Laravel guardan comandos ejecutables desde la
raíz de un proyecto con sus dependencias instaladas; test, lint y build pasan.

**Fuera:** cambiar de framework de pruebas, linter o gestor de paquetes.

**Archivos orientativos:** `catalogo/herramientas/node-express.yml`,
`catalogo/herramientas/node-nestjs.yml`, `catalogo/herramientas/php-laravel.yml` y
`cli/test/catalog/content.test.ts`.
