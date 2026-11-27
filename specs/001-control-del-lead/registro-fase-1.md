# SDD ledger — plan: specs/001-control-del-lead/plan-fase-1.md

Spec: specs/001-control-del-lead/diseno.md (aprobado 2026-11-10).
Herramientas propias: brief.sh N (extrae la tarea), snap.sh N (foto previa), pkg.sh N (paquete de revisión por diferencias). Sin commits: Git es de Fernando.

## Revisión previa del plan

| Tareas | Producen / consumen | Hallazgo |
|---|---|---|
| 1 ↔ 9 | 1 mueve AGENTS.template.md a plugin/; 9 lo usa | Coherente: 9 cita plugin/AGENTS.template.md |
| 1 ↔ README | 1 cambia rutas de README.es.md; README lo reescribe | Orden: README después de 1 |
| 2 ↔ todas | tipos compartidos (Policy, Review, GateEvidence) | Coherente tras corregir Review |
| 4 ↔ 5 ↔ 6 | CatalogEntry, loadCatalogEntry | Coherente |
| 6 ↔ 9 | init debe llamar a generateAll; 6 «solo guarda», ninguna tarea lo conecta | Hueco → Ruling 2 |
| 6 ↔ 12 | 6 siembra dependencias existentes; 12 parsea dependencias | Duplicaría el parseo → Ruling 3 |
| 7 ↔ 6 | run.ts compartido | Coherente |
| 8 ↔ 9 ↔ 18 | planWrite / WriteOutcome | Coherente |
| 10 ↔ 11-17 | workflows invocan `lead-flow puerta …` y jobs de decisión antes de existir | Aceptable: 10 solo prueba propiedades del YAML |
| 11 ↔ 13-17 | GitHubClient: faltan métodos (estado de commit, comentar/cerrar incidencia, rulesets) | Hueco → Ruling 4 |
| 13 ↔ 14 | 14 añade un test a approval.test.ts | Coherente |
| 15 | policyHash sin origen definido | Hueco → Ruling 5 |
| 13 | glob con path.matchesGlob (Node ≥ 22) o función propia | Restricción Node ≥ 20 → Ruling 6 |
| Cada tarea | tests ↔ código ↔ archivos | Sin contradicciones internas encontradas |

## Rulings

- Ruling 1: sin commits de agentes; cada tarea se revisa con foto previa y diferencias (snap/pkg); el trabajo queda sin commitear en `main` y Fernando crea rama y hace commit — Git es solo de Fernando (su norma y el hook lo bloquean) — si es erróneo: Fernando tendría que separar el trabajo en commits a mano, guiado por los comandos de cada tarea.
- Ruling 2: la Tarea 9 conecta `init` con `generateAll` al terminar la entrevista — el diseño (§5.2) dice que init ejecuta el generador — si es erróneo: se mueve una línea.
- Ruling 3: la Tarea 6 crea `cli/src/dependencies/read.ts` con `readDirectDependencies(content: string, ecosistema: 'npm' | 'pip'): string[]`; la Tarea 12 lo reutiliza para base y cabeza — evita duplicar el parseo — si es erróneo: un archivo de más.
- Ruling 4: cada tarea añade a `cli/src/github/client.ts` los métodos de API que necesita (sigue siendo el único archivo que llama a GitHub) — el plan no los listaba todos — si es erróneo: ninguno, el archivo crece por tareas.
- Ruling 5: `policyHash` = SHA-256 del contenido de `.lead/politica.yml` en el commit integrado; lo calcula quien llama a buildReport — el informe debe poder ligarse a la política vigente — si es erróneo: cambia una función.
- Ruling 6: glob con función propia (`*`, `**`) siempre, sin `path.matchesGlob` — cumple Node ≥ 20 sin dos caminos — si es erróneo: una función pequeña de más.
- Ruling 7: tarea extra «README con la historia», tras la Tarea 1, en paralelo con las tareas de `cli/` (archivos disjuntos: README.es.md, assets/, doc/investigacion.md); verificación de cifras en fuentes originales en paralelo desde ya — Fernando lo pidió «lo antes posible» y el diseño §9.2 exige cifras verificadas — si es erróneo: los paquetes de revisión de esas tareas se filtran por ruta.

## Progreso
- Task 1: dispatched (sonnet), foto snap-1. Investigación de cifras: dispatched (sonnet, en paralelo).
- Investigación de cifras: completa → doc/investigacion.md (7/9 verificadas + DORA 2025; CSA 62 % y JetBrains: no usar).
- Task 1: implementada (DONE_WITH_CONCERNS: selector eslint para métodos de clase; npm audit en devDeps). En revisión (sonnet).
- Task 1: complete (foto snap-1, review clean). Minors diferidos:
  - Task 1: minor (deferred): selector eslint `FunctionExpression:not(MethodDefinition > FunctionExpression)` es desviación de la plantilla readfirst (correcta); avisar a Fernando por si la sube a la norma.
  - Task 1: minor (deferred): max-lines-per-function desactivado en test/**/*.test.ts sin declararlo.
  - Task 1: minor (deferred): tsconfig include ["src"] deja test/ sin comprobar tipos.
  - Task 1: minor (deferred): LeadFlowError.code no es readonly.
  - Task 1: minor (deferred): LICENSE/NOTICE fuera de plugin/ (el plugin instalado no los lleva).
- Ruling 8: CSA 62 % no se usa en ningún texto; las leyendas de la historia que lo mezclaban («entre el 25 % y el 60 %») se sustituyen por cifras de doc/investigacion.md — la verificación mostró atribución errónea — si es erróneo: ninguno, se usa solo lo verificado.
- Task 2: dispatched (sonnet), foto snap-2. README: dispatched (opus), en paralelo; su revisión filtrará por README.es.md y assets/.
- 11:37: Task 2 y README cortados por el límite de uso de 5 h (vuelve a las 14:00). No escribieron nada. Reanudación programada a las 14:04 (sesión).
- 11:40: el uso volvió antes de lo anunciado; Task 2 y README reanudados (mismos agentes). Reanudación programada cancelada.
- Task 2: complete (foto snap-2, review clean). Minors diferidos:
  - Task 2: minor (deferred): zona_horaria solo se valida como texto → Ruling 9.
  - Task 2: minor (deferred): código 'POLITICA_INVALIDA' duplicado en schema.ts y store.ts.
  - Task 2: minor (deferred): PROJECT_TYPES y ECOSYSTEMS como string[] sin enlace al tipo; `value as number` evitable.
  - Task 2: minor (deferred): fallo de readFile siempre como POLITICA_NO_ENCONTRADA (incluye la causa).
  - Task 2: minor (deferred): faltan tests de errores anidados y de formatos fecha/hora; imports duplicados en store.test.ts.
- Ruling 9: la Tarea 12 añade la validación de `proyecto.zona_horaria` en schema.ts (con attemptSync e Intl, mensaje que nombra la clave) antes de usarla — la Tarea 12 es la primera que la consume y el foco de revisión 1 exige mensajes claros — si es erróneo: un Europe/Madird daría una RangeError en CI.
- Task 3: review → Needs fixes (3 Important: registros escribibles pero no legibles; tema vacío rompe numeración; test de no-pisar no ejerce la protección). Minors diferidos:
  - Task 3: minor (deferred): fallo de writeFile siempre como DECISION_YA_EXISTE (comprobar EEXIST).
  - Task 3: minor (deferred): regex con caracteres combinantes invisibles (usar escape con nombre).
  - Task 3: minor (deferred): mkdir/readFile sin attempt() ni LeadFlowError.
  - Task 3: minor (deferred): faltan tests de DECISION_INVALIDA (archivo roto) y DECISIONES_NO_LEGIBLES.
- Task 3: fix round 1/5 dispatched (resume implementer), foto snap-3b.
- Task 3: fix round 1/5 (1 addressed, 2 open — autor/fecha con "## " rompen la lectura; test de colisión con carrera). Out-of-scope: posible ruido CRLF/LF en los dos archivos; trim al leer (minor deferred).
- Task 3: fix round 2/5 dispatched, foto snap-3c.
- Task 3: fix round 2/5 (3 addressed, 0 open).
- Task 3: complete (fotos snap-3..snap-3c, review clean tras 2 rondas). Minor diferido: parseRecord parte título y opciones solo por '\n' (un registro editado a mano con CRLF no se lee bien).
- Task 4: review → Needs fixes (1 Important: el test «never marks an option as recommended» no prueba el principio).
- Ruling 10: en el catálogo se RECHAZAN (CATALOGO_INVALIDO) los campos desconocidos de una opción y los textos que marcan una opción como preferida («recomendado/a», «recomendamos», «la mejor opción», sin distinguir mayúsculas ni tildes); se PERMITE citar a terceros («OWASP recomienda Argon2id») porque es información, no un ranking — el principio 2 del diseño es «se informa, no se aconseja» — si es erróneo: una opción legítima con «la mejor opción» en el texto tendría que reformularse.
- Task 4: minor (deferred): tema/stack del YAML no se comparan con la ruta; join sin validar (salida de root con ../) — hoy los valores son internos; revisar en Tarea 7 (cambiar <tema> valida contra la tabla).
- Task 4: minor (deferred): isStale con today no parseable devuelve false sin aviso; borde 183/184 sin test; cast `as string[]`; ramas de validación sin test.
- Task 4: fix round 1/5 dispatched, foto snap-4b.
- Task 4: fix round 1/5 (1 addressed, 0 open).
- Task 4: complete (fotos snap-4, snap-4b; review clean). Minor diferido: el filtro de preferencia es léxico («preferida», «recomendable» no se detectan).
- Task 5: review → Needs fixes (2 Important: docs de Laravel 12.x marcada como antigua; opción JWT de NestJS sin paquete y con requisito inventado).
- Ruling 11: los hallazgos de neutralidad (Minor 3 y 4: «habitual», «más reciente… menos ejemplos», «no suele necesitarlo», «es la configuración que genera NestJS» como argumento) entran en la ronda de arreglos como Important — incumplen el principio 2 del diseño («se informa, no se aconseja»), que es el corazón del producto — si es erróneo: unas frases más neutras de lo necesario.
- Task 5: minor (deferred): test `offers token and server-session options…` solo comprueba ≥2 opciones; listFiles supone carpetas; docs JWT de Express apunta al README de la librería; dotnet opción 2 sin el fragmento WarningsAsErrors.
- Task 5: fix round 1/5 dispatched, foto snap-5b.
- Task 5: fix round 1/5 (3 addressed, 0 open).
- Task 5: complete (fotos snap-5, snap-5b; review clean). Minors diferidos: Maven «XML largo» es valoración sutil; php-laravel opción 1 dice «trae PHPUnit» cuando la 13.x incluye Pest y PHPUnit.
- README: implementado (DONE_WITH_CONCERNS). GitHub no reconoce README.es.md como portada (API /readme → 404) → Ruling 12. Generador de los SVG solo en la carpeta temporal del agente → Ruling 13. En revisión.
- Ruling 12: el README pasa a llamarse README.md (en castellano, el público principal); README.es.md desaparece y se actualizan los enlaces que lo citen — GitHub solo muestra como portada README.md — si es erróneo: renombrar de vuelta; una versión inglesa sería README.en.md más adelante.
- Ruling 13: el generador de los SVG se guarda en el repositorio (assets/historia/fuente/generar.mjs) con una línea en el README de cómo regenerarlos — el diseño pide pulir la historia y producir el vídeo después; sin la fuente habría que rehacerla — si es erróneo: un archivo de más.
- Task 6: implementada (DONE_WITH_CONCERNS). En revisión.
- Ruling 14: init deja `github.modo = 'aviso'` hasta que `proteger` (Tarea 17) compruebe el plan y aplique los rulesets — restricción global: nunca afirmar un bloqueo que no existe — si es erróneo: un proyecto protegido mostraría «modo aviso» hasta ejecutar proteger.
- Task 6: review → Needs fixes (2 Important: comandos sacados de la prosa del catálogo, ya produce uno erróneo en dotnet; falta la pregunta de delegados).
- Ruling 15: las opciones de `herramientas` del catálogo llevan un campo estructurado `comandos: { pruebas, lint, build }` (obligatorio en ese tema, prohibido en los demás); el cargador lo valida, el contenido de las 6 entradas se completa, y la entrevista usa ese campo en lugar de parsear prosa, mostrando el valor como «sugerencia del catálogo, revísala» — los comandos acaban en la política y en la CI; parsear prosa ya produjo uno erróneo — si es erróneo: el catálogo pasa de 7 a 8 campos en un tema (cambio menor al §5.3 del diseño).
- Ruling 16: init pregunta los delegados (tema → persona, hasta dejar el tema vacío) y, si algún nivel elige «delegado» sin delegados definidos, avisa y vuelve a preguntar — diseño §5.1 y §5.5 — si es erróneo: una pregunta de más en la entrevista.
- Ruling 17: entran también en esta ronda dos menores ligados a principios del producto: catálogo ausente → LeadFlowError en vez de degradar en silencio a «otra» (principio: leer del catálogo); la decisión «comandos» registra los comandos que quedaron en la política (auditoría) — coste bajo — si es erróneo: ninguno.
- Task 6: minor (deferred): ecosistema detectado prima sobre el del stack elegido; literales sueltos y números sin validar hasta el final; questions.ts ~370 líneas (partir en commands.ts / catalogChoices.ts).
- Task 6: fix round 1/5 dispatched, foto snap-6b.
- Task 6: fix round 1/5 (4 addressed, 0 open).
- Task 6: complete (fotos snap-6, snap-6b; review clean). Minors diferidos: `vitest run` sin npx en node-express/nestjs y `phpcs` sin ./vendor/bin/ en php-laravel; mvn package ya ejecuta pruebas; mkdtemp sin limpiar en un test.
- Task 7: review → Needs fixes (1 Important: `cambiar stack` guarda comandos vacíos y el schema los acepta).
- Ruling 18: (1) el schema exige texto no vacío en stack.comandos.pruebas/lint/build; (2) `cambiar` encadena temas dependientes con una tabla FOLLOW_UP_TOPICS = { stack: ['comandos'] } y escribe una decisión por cada tema preguntado (dos en este caso) — la regla «una decisión» buscaba no tocar las antiguas, y encadenar no las toca; falla cerrado — si es erróneo: cambiar el stack pregunta una cosa más.
- Task 7: minor (deferred): `=async` sin espacio en run.ts:211; tras cambiar el stack, autenticación y ecosistema pueden quedar desfasados (avisar); `cambiar` sin tema dice «El tema «» no existe» (mensaje de uso); JSON.stringify para comparar listas.
- Task 7: fix round 1/5 dispatched, foto snap-7b.
- Task 7: fix round 1/5 (1 addressed, 0 open).
- Task 7: complete (fotos snap-7, snap-7b; review clean). Minor diferido: FOLLOW_UP_TOPICS como Record<string,…> (frágil ante claves del prototipo; hoy seguro por findTopic).
- README: review → Needs fixes (7 Important: filtro de la escena 6 se vuelve verde con el pago parado; pago visible solo un 25 % del ciclo; ilegible en móvil; «una semana en un día» es cifra inventada; tiempo verbal sugiere que lead-flow ya funciona; escena 7 «el cliente recibe esto» muestra el informe interno; sin llamada a la acción).
- Ruling 19: «Lo que antes era una semana, en un día» se sustituye por «La IA construye mucho más rápido de lo que el equipo puede revisar.» — regla del encargo: ninguna cifra de mejora inventada, y choca con METR — si es erróneo: Fernando puede recuperar la frase de la maqueta.
- Ruling 20: la escena 7 pasa a «SI EL CLIENTE PIDE PRUEBAS, RECIBE ESTO» — el diseño dice que el informe por ticket es interno y se entrega a quien lo exija por contrato — si es erróneo: un rótulo.
- Ruling 21: los Minor de la revisión del README entran en la misma ronda (matices de cifras, jerga, contraste AA, «Dev:» → «Dato:»/«Para el equipo técnico:», etc.) — el README es el escaparate y el listón es «muy pulido» — si es erróneo: más cambios de los estrictamente necesarios.
- README: fix round 1/5 dispatched (incluye Rulings 12 y 13), foto snap-R2.
- Task 8: implementada (DONE, 88 pruebas), revisión PENDIENTE. Pausa pedida por Fernando: solo trabaja el README hasta que termine; luego revisar Task 8 y seguir con la 9.
- 2026-11-11 07:54: README cortado por el límite a mitad de la ronda 1 (ya había renombrado a README.md, movido generar.mjs y rehecho escenas); reanudado.
- README: fix round 1/5 (todo addressed). README: complete. Minors diferidos: rojo #ff5555 sobre #2a2c3a 4,40:1 en «pago ✗»; sin explicar ticket, incidencia, QA, migraciones; frase de presente antes del aviso de estado.
- 2026-11-11: el registro pasa a specs/001-control-del-lead/registro-fase-1.md (se sube a Git) y las herramientas a specs/001-control-del-lead/sdd/, para seguir desde otro ordenador. Lista de lo pendiente: specs/001-control-del-lead/pendiente-fase-1.md. Desde aquí se actualiza este archivo.
- 2026-11-11: Fernando renombra el repositorio a github.com/fernando-delrio/lead-flow; se cambian las referencias en README.md, diseno.md, plan-fase-1.md y pendiente-fase-1.md (la acción pasa a fernando-delrio/lead-flow/acciones/puertas@v0).
- 2026-11-19: Fernando pide terminar todo lo pendiente sin parar (se va de la oficina). Se sigue con el plan; nada se commitea (Ruling 1); los commits por tarea se le dan al final.
- Ruling 22: hueco A — cada tarea que crea una lógica conecta su subcomando en `cli/src/index.ts` (`generar` en la 9, `puerta <nombre>` en la 11 y siguientes, `proteger` en la 17); los jobs de decisión, informe, excepciones y parte llaman a subcomandos `lead-flow <job>` que añade la tarea dueña — ninguna tarea lo tenía asignado y sin ello los workflows no ejecutan nada — si es erróneo: se mueven entradas de una tabla.
- Ruling 23: hueco B — la acción compuesta construye el CLI desde este repositorio (checkout de `fernando-delrio/lead-flow` en la ref de la acción, `npm ci && npm run build` en `cli/`) en lugar de bajarlo de npm — publicar en npm es decisión de Fernando y no debe bloquear la fase 1 — si es erróneo: cambia un paso de la acción.
- Task 8: review dispatched (sonnet) sobre el commit 01fb3e6 (git show). Task 9: dispatched (sonnet) en paralelo, foto snap-9 (incluye la 8; su paquete se filtra por las rutas de la 9).
- Task 8: complete (commit 01fb3e6, review clean). Minors diferidos: diferencia de `actualizado` muestra el archivo entero; `as string` y `!` en blocks.ts (extraer findManagedBlock); planWrite 22 líneas; archivo existente vacío da conflicto sin test; faltan tests de estilo hash y de `generated` con marcador dentro.
- Task 9: implementada (DONE_WITH_CONCERNS, 96 pruebas): `.mdc` de Cursor sin cabecera `---` en la línea 1; comentarios `#` del bloque dentro de los .yml de plantillas; secciones sin dato se omiten. En revisión (sonnet).
- Ruling 24: `CommentStyle` gana el estilo `mdc`: al crear el archivo escribe la cabecera fija de Cursor (`---` / `description` / `alwaysApply: true` / `---`) ANTES del marcador de inicio, y al actualizar solo reemplaza el bloque entre marcadores — sin cabecera en la línea 1 Cursor no aplica la regla siempre, que es el objetivo — si es erróneo: un estilo de más en la tabla de blocks.ts.
- Task 9: review → Needs fixes (4 Important: escritura de generateAll no atómica; salida dice «creado» con conflicto; valores de la política sin validar inyectan reglas en CODEOWNERS y rompen bloques/código; bloque duplicado entre cursor.ts y copilot.ts).
- Ruling 25: generateAll escribe primero cada archivo a un temporal junto al destino y después renombra; si algo falla, restaura el contenido previo de los ya renombrados y borra los temporales, y lanza LeadFlowError — el diseño exige no dejar el repositorio a medias — si es erróneo: unas líneas más.
- Ruling 26: la validación de la política (schema.ts) rechaza nombres de GitHub que no cumplan `^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$` (lead, scrum_master, qa, delegados; se admite `@` delante y se normaliza) y cualquier texto con saltos de línea o con `lead-flow:inicio` / `lead-flow:fin`; los comandos se pintan con un span de código cuyo delimitador es más largo que la mayor racha de backticks del comando (CommonMark) — un valor de la política acaba en CODEOWNERS y en las instrucciones de los agentes — si es erróneo: una política antigua con un nombre raro tendría que corregirse.
- Task 9: fix round 1/5 dispatched (resume implementer), foto snap-9b; incluye Ruling 24.
- Task 9: fix round 1/5 implementada (112 pruebas). Duda: lectura fallida de un archivo existente lanza sin código (minor). Re-review dispatched.
- Task 9: fix round 1/5 (4 addressed + rulings; 1 nuevo Important N1: temporales que quedan si falla la preparación). Fix round 2/5 dispatched, foto snap-9c (N1 + minors N2, N4, N5).
- Task 9: fix round 2/5 (4 addressed, 0 open). Task 9: complete (fotos snap-9, 9b, 9c; review clean). Minors diferidos: bytes no UTF-8 en la restauración; exitCode de index.ts sin prueba; prueba de preparación fallida con setTimeout(100); carpetas creadas por mkdir no se deshacen; la entrevista valida los handles solo al final (⚠️ revisión final); secciones de AGENTS.md sin dato se omiten.
- Task 10: dispatched (opus), foto snap-10.
- Task 10: implementada (DONE_WITH_CONCERNS, 138 pruebas; acciones fijadas por SHA, gitleaks con SHA-256). Avisos: lo que hace GITHUB_TOKEN no dispara workflows (PR de excepción sin puertas; integración automática sin informe); input `puerta` reutilizado para los pasos de decisión; evidencias solo en workflow_run; reseñas en forks con token de lectura; Node 20 sin soporte desde abril de 2026.
- Ruling 27: (1) secreto opcional `LEAD_FLOW_TOKEN` (GitHub App o token fino; lo decide y crea Fernando/la lead): si existe, los jobs que crean pull requests o activan la integración automática lo usan en lugar de GITHUB_TOKEN, para que GitHub dispare los workflows; (2) sin él, `lead-flow-informe.yml` también corre con `schedule` (y `workflow_dispatch`) y genera los informes de las pull requests integradas que no lo tengan, y la pull request de excepción dice en su cuerpo que hay que cerrarla y reabrirla para lanzar las puertas — es una limitación documentada de GitHub; el criterio de la fase 1 «genera su informe» se cumple igual, con retraso — si es erróneo: un disparador y un `env` de más.
- Ruling 28: la acción usa Node 24 (LTS activa; Node 20 sin soporte desde abril de 2026); `engines` del paquete sigue en ≥20 hasta que Fernando decida — si es erróneo: cambia un número.
- Ruling 29: forks fuera de la fase 1 (diseño, decisión 7): el aviso de reseñas en forks se documenta, no se arregla — si es erróneo: fase 2.
- Task 10: review dispatched (opus, seguridad).
- Task 10: review → Needs fixes (2 Important: aprobación lee evidencias que la pull request puede falsificar —sin `needs: integridad`, comodín y merge-multiple—; el job de excepciones arranca para cualquier comentario).
- Ruling 30: `lead-flow-decision.yml` deja de usar `pull_request_review` directo (ejecuta el workflow de la rama de la pull request con permisos): un workflow mínimo sin permisos `lead-flow-resena.yml` (pull_request_review) solo existe para disparar `workflow_run`; la decisión corre con `workflow_run` de [puertas, reseña] y `pull_request_target`, siempre desde la rama por defecto. `aprobacion` tiene `needs: integridad`; las evidencias se bajan con `run-id` del workflow_run concreto y nombre exacto por puerta, cada una en su carpeta, sin comodines ni merge-multiple — el plan pedía `pull_request_review`, pero la restricción global «nunca ejecutar código de la pull request con permisos» manda — si es erróneo: un workflow de más.
- Ruling 31: la Tarea 17 activa en el ruleset «revisión obligatoria de CODEOWNERS» (`require_code_owner_review`): quien tiene escritura puede publicar estados desde un workflow modificado en su pull request, y la única defensa de verdad es que `.github/workflows/` y `.lead/` exijan la aprobación de la lead (CODEOWNERS, Tarea 9) — si es erróneo: ninguno, es más estricto.
- Task 10: fix round 1/5 dispatched (resume implementer, incluye Rulings 27, 28, 30 y menores), foto snap-10b.
- Task 10: fix round 1/5 implementada (150 pruebas). Contratos para tareas siguientes: Task 13 comprueba `workflow_run.conclusion` y que la evidencia es de la cabeza actual; si la decisión no viene de la ejecución de puertas, baja la evidencia por la API; solo lee `<carpeta>/<puerta>.json` de las carpetas de `LEAD_FLOW_EVIDENCIAS_PR`. Task 11: archivos de configuración de herramientas que vienen de la pull request (p. ej. .gitleaks.toml) no deben desactivar la puerta. Task 15: `informe` y `informe --pendientes` pueden escribir cadena.json a la vez (concurrency de grupo único en la rama informes). Re-review dispatched.
- Task 10: fix round 1/5 (2 addressed; 3 nuevos Important: aprobación saltada deja un verde antiguo; filtro por `workflow_run.path` probablemente nunca se cumple; disparadores sin evidencias y cancelación de la ejecución que las traía).
- Ruling 32: un solo camino de lectura de evidencias: la CLI (Tarea 13) las pide siempre por la API para la cabeza actual de la pull request (ejecuciones del archivo `lead-flow-puertas.yml` con `head_sha`, artefactos por nombre exacto); el workflow de decisión deja de bajar artefactos y de comparar `workflow_run.path`. Así todo disparador es autosuficiente y `cancel-in-progress` no pierde nada — resuelve N2 y N3 a la vez y elimina la superficie de envenenamiento de artefactos — si es erróneo: más llamadas a la API (dentro del límite).
- Ruling 33: `aprobacion` corre con `if: always()` y recibe `needs.integridad.result`; si no es `success`, la CLI publica `lead-flow/aprobacion` en fallo — fallar cerrado — si es erróneo: ninguno.
- Ruling 34: `informe` y `informe --pendientes` comparten el grupo de concurrencia `lead-flow-informes` sin cancelar; `parte` sigue con GITHUB_TOKEN (mínimo privilegio; la letra del Ruling 27 se ajusta a «donde haga falta disparar workflows»); `LEAD_FLOW_TOKEN` ignora `permissions:` y se documenta que debe ser un token fino con lo mínimo — si es erróneo: ninguno.
- Task 10: fix round 2/5 dispatched, foto snap-10c.
- Task 10: fix round 2/5 implementada (152 pruebas). Desviación aceptada del Ruling 33: `!cancelled()` en vez de `always()` (evita que una ejecución cancelada publique encima de la nueva).
- Ruling 35: en `workflow_run` los checks de job se cuelgan del commit de la rama por defecto, no de la cabeza de la pull request; por eso la CLI publica estados de commit `lead-flow/integridad` (Tarea 11) y `lead-flow/aprobacion` (Tarea 13) sobre el head SHA, y la Tarea 17 exige `pruebas`, `secretos`, `sast`, `dependencias` (checks del workflow pull_request) más esos dos estados — si es erróneo: cambia la lista de comprobaciones obligatorias.
- Task 10: re-review ronda 2 dispatched.
- Task 10: fix round 2/5 (3 addressed, 0 open). Task 10: complete (fotos snap-10, 10b, 10c; review clean). Minors diferidos: cola de informe a nivel de workflow (pasar a cada job); `COLLABORATOR` incluye colaboradores de solo lectura; token fino por job; ejecuciones de reseña ilimitadas; semgrep sin hashes; `@v0` por etiqueta; ⚠️ qué recibe `aprobacion` si integridad agota su tiempo (comprobar en la Tarea 18).
- Contrato para la Tarea 13 (R2-M2): solo cuenta la ejecución de puertas con evento `pull_request`, del head SHA actual y su último intento.
- Ruling 36: los artefactos de evidencia se bajan con `gh run download <id> -n <nombre> -D <carpeta>` llamado desde `cli/src/github/client.ts` (sigue siendo el único archivo que habla con GitHub; `gh` viene instalado en los runners de GitHub y el plan ya lo lista); el resto de la API con fetch — evita escribir un lector de zip sin dependencias — si es erróneo: un lector de zip con zlib.
- Ruling 37: los archivos que cambian el comportamiento de las herramientas (`.gitleaks.toml`, `.gitleaksignore`, `.semgrepignore`, `.semgrep.yml`) pasan a la lista protegida de integridad y a CODEOWNERS (lead y scrum master); además la puerta llama a las herramientas con su configuración explícita, ignorando la del repositorio cuando la herramienta lo permite — una pull request no puede apagar su propia puerta — si es erróneo: la lead tendría que aprobar un cambio de configuración legítimo.
- Riesgo aceptado (documentar en la Tarea 18): la evidencia de un job que ejecuta código de la pull request (pruebas) vale lo que ese código; las puertas de secretos, SAST y dependencias no lo ejecutan.
- Task 11: dispatched (opus), foto snap-11.
- Task 11: implementada (DONE_WITH_CONCERNS, 209 pruebas). Aceptado: `statuses: write` en el job integridad (necesario para Ruling 35). Avisos: gitleaks lee siempre .gitleaksignore (¿existe --gitleaks-ignore-path?); flag de semgrep interno; herramientas no ejecutadas en local. En revisión (opus).
- 2026-11-20: límite de 5 h a mitad de la revisión de la Tarea 11 (reanudar ese revisor). Fernando hace commit de las Tareas 9, 10 y 11 juntas (la 11 pendiente de revisión). Verificado antes: 209 pruebas, lint y build en verde.
- 2026-11-20: Fernando pide parar. Revisión de la Tarea 11 detenida a mitad (sin veredicto). Al volver: relanzar o reanudar la revisión de la 11 con review-task-11.diff y seguir con la 12.
- 2026-11-26: Fernando pide seguir sin parar. Task 11: review relanzada (opus, revisor nuevo).
- 2026-11-26: Fernando: si se corta por límite de uso, al restaurarse seguir solo desde este registro.
- Task 11: review → Needs fixes (1 Critical: un `.gitattributes` con `* -diff` esconde secretos a gitleaks y no está protegido; 3 Important: carrera entre cabeza y lista de archivos en integridad, semgrep ignora `errors` y archivos >1 MB, falta la auditoría de vulnerabilidades del brief; 9 Minor).
- Ruling 38: `.gitattributes` (en cualquier carpeta) entra en `TOOL_CONFIG_FILES`, en la lista protegida y en CODEOWNERS, y gitleaks recibe `--text` dentro de `--log-opts` — una pull request no puede cambiar cómo git enseña su propio diff — si es erróneo: la lead aprueba cambios de `.gitattributes` legítimos.
- Ruling 39: integridad vuelve a leer la pull request al final; si la cabeza o la base cambiaron, `no_verificado` y estado `failure` — si es erróneo: la siguiente ejecución lo corrige.
- Ruling 40: semgrep: un error de nivel `error` (o tiempo agotado) en `report.errors` da `no_verificado`; los avisos (`warn`) se cuentan en el resumen y en `detalles`; `--max-target-bytes 0` para no saltarse archivos grandes — si es erróneo: más `no_verificado` en repositorios con archivos que semgrep no entiende.
- Ruling 41: la auditoría de vulnerabilidades (`npm audit --json` / `pip-audit -f json`, el código 1 con hallazgos es aceptado) pasa a la Tarea 12, que conecta `puerta dependencias` y ya recibe `audit: GateEvidence` — si es erróneo: ninguno, solo cambia de tarea.
- Ruling 4 confirmado (ya estaba): el cliente de GitHub crece por tarea.
- Task 11: fix round 1/5 dispatched (opus, implementador nuevo: el de la Tarea 11 no se puede reanudar), foto snap-11b. Incluye Minors 1, 3, 4, 7, 8 y 9. Aplazados: M2 (escribirlo en la Tarea 17 y en el riesgo aceptado), M5 (forks fuera de la fase 1, Ruling 29), M6 (cmd.exe solo afecta a uso local).
- Task 11: fix round 1/5 implementada (221 pruebas). Avisos: nombres de tipos de error de semgrep de memoria (comprobar en la Tarea 18); `--text` sin rango repite los valores por defecto de gitleaks (`--full-history --all --diff-filter=tuxdb`); `toSorted` no compila con target ES2022 (aplazado a la revisión final: Node 20 ya lo tiene, sería subir el target a ES2023). Re-review dispatched.
- Task 11: fix round 1/5 (3 addressed, 0 open). Task 11: complete (fotos snap-11, 11b; review clean). Minors diferidos: carrera ABA de I1 (force-push que vuelve a la misma cabeza) y mensaje «cabeza X → X» si solo cambia la base, sin prueba de ese caso; errores de semgrep sin `level` cuentan como aviso y un `Syntax error` de nivel `warn` deja el archivo sin analizar con `ok` (⚠️ revisión final); `toContain('2')` débil en tools.test.ts:174; contador mutado en el cliente falso; `hasApproval` y `pick` repetidos; `.sort()` hasta subir target a ES2023. Por confirmar en la Tarea 18: `/pulls/{n}/files` con la cabeza nueva, tipos de error reales de semgrep 1.186.0, coste de `--text` en todo el historial.
- pkg.sh: diff con `--strip-trailing-cr` (los finales CRLF de la copia de trabajo inflaban el paquete).
- Ruling 42: `lead-flow puerta dependencias` obtiene la base con `git show <base.sha>:<manifiesto>` (sha de `GITHUB_EVENT_PATH`, validado; spawn sin shell; el job ya hace `fetch-depth: 0`) y la cabeza del checkout. Las licencias de las dependencias nuevas se piden al registro (npm: `registry.npmjs.org/<nombre>/latest`, campo `license`; pip: `pypi.org/pypi/<nombre>/json`, `info.license` o el clasificador `License ::`) con fetch inyectable, sin instalar las dependencias de la pull request: el plan decía license-checker/pip-licenses, que exigen instalar y ejecutar código de la pull request. Licencia que no se puede leer → `fallo` que la nombra (pide excepción). — si es erróneo: la licencia de `latest` puede no ser la de la versión pedida (raro; se documenta).
- Ruling 43 (desarrolla el 41): auditoría con `npm audit --json --audit-level=high --package-lock-only` (sin `package-lock.json` → `no_verificado`) y `pip-audit -r requirements.txt -f json`; códigos 0 y 1 aceptados; vulnerabilidades altas o críticas (npm) o cualquiera con arreglo conocido (pip) → `fallo`. pip-audit resuelve dependencias y puede ejecutar código de compilación de la pull request: mismo riesgo aceptado que la puerta de pruebas (job sin token y `contents: read`). La acción instala pip-audit con versión fijada solo para la puerta dependencias. — si es erróneo: cambia el umbral.
- Task 12: dispatched (opus), foto snap-12.
