# AGENTS.md — <Nombre del proyecto>

Mantén esta entrada corta (objetivo: 60-100 líneas). El detalle vive en `doc/` y se lee solo
cuando corresponde. Si supera 120 líneas, mueve el detalle a `doc/` y deja aquí regla y enlace.

**Qué es:** <producto, público y estado en una frase>.
**Pregunta de control:** ¿lo pondría delante del cliente ahora mismo, sin avisar de nada? Si la
respuesta es «sí, pero…», no está terminado.

## Stack y comandos
- Frontend: <stack>. Backend: <stack>. Base de datos: <desarrollo y producción>.
- Arrancar: `<backend>` · `<frontend>`.
- **Probar:** `<tests backend>` · `<lint backend>` · `<tests frontend>` · `<lint frontend>` · `<build>`.
- Dependencias: `<pip-audit>` · `<npm audit --audit-level=high>`.

## Estructura y código
- <Reglas de módulos, capas y dependencias>.
- Antes de crear un archivo: dueño, capa, producción o prueba y consumidores.
- <5-8 reglas concretas y comprobables>. Lo mecánico se vigila con pruebas o lint.

## Dominio y seguridad
- <Lo que nunca se dice o hace y la prueba que lo vigila>.
- <Consultas parametrizadas, secretos fuera del código, autenticación, CORS…>.

## Forma de trabajar
- Incrementos pequeños de extremo a extremo. Prueba antes que código en la lógica.
- **Git es de la persona:** el agente propone comandos, nunca los ejecuta.
- Al terminar: parar, resumir y esperar. Primero spec, luego plan, tareas y código.

## Límites
- ✅ Siempre: leer antes de editar y ejecutar las pruebas afectadas.
- ⚠️ Pregunta antes: dependencias, migraciones aplicadas y despliegue.
- 🚫 Nunca: Git, credenciales o afirmar algo no ejecutado.

## Verificación
Pruebas y lint en verde, documentación al día y diff pequeño. Según lo tocado, ejecuta en paralelo
`puerta-seguridad`, `puerta-rendimiento` y `revisor-diseno`; `cierre-incremento` confirma qué falta.

## Lee X cuando toques Y
| Si tocas… | Lee |
|---|---|
| <tema> | `doc/<archivo>.md` |
