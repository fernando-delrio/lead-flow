# CLAUDE.md — <Nombre del proyecto>

@AGENTS.md

Las reglas comunes están en `AGENTS.md`. Aquí solo se define el flujo de Claude Code.

```text
planificador → revisor (spec) → aprobación → planificador (plan y tareas) → aprobación
  → implementador (una tarea) → puertas en paralelo → revisor (requisito por requisito)
  → cierre-incremento → commit de la persona
```

- Lanza juntas las puertas correspondientes al cerrar el incremento. Son de solo lectura.
- Lánzalas una vez por incremento, no tras cada edición.
- Planificador, revisor y seguridad usan opus; los demás, sonnet. Para datos sensibles, el
  implementador puede usar opus.
