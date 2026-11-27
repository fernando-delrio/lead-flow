# CLAUDE.md — Demostración de Equipo Solo

@AGENTS.md

## Flujo de agentes

```text
planificador → aprobación → implementador → puertas → revisor → cierre-incremento
```

- Usa los agentes con el prefijo `equipo-solo:`.
- Seguridad y rendimiento son puertas de solo lectura y pueden ejecutarse en paralelo.
- Para este ejemplo no hace falta la puerta de diseño.
- Para después de cada incremento y espera la señal de la persona.
