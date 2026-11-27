# Equipo Solo

[English](README.md) · [Español](README.es.md)

Plugin de Claude Code para una persona que desarrolla un proyecto full stack sin un equipo de
revisión permanente. Reúne siete agentes con responsabilidades separadas: planificar, implementar,
revisar, comprobar seguridad, rendimiento y diseño, y cerrar un incremento.

## Instalar

```bash
claude plugin marketplace add fernando-delrio/lead-flow
claude plugin install equipo-solo@equipo-solo
```

Comprueba la instalación:

```bash
claude plugin details equipo-solo@equipo-solo
```

La salida debe mostrar la versión `0.1.0` y siete agentes.

## Preparar un proyecto

1. Copia `AGENTS.template.md` a la raíz del proyecto como `AGENTS.md`.
2. Copia `CLAUDE.template.md` como `CLAUDE.md`.
3. Sustituye los marcadores, especialmente los comandos reales de pruebas, lint y build.
4. Abre una sesión nueva de Claude Code y ejecuta `/agents`.

El recorrido completo y el motivo de cada responsabilidad están en [`doc/FLUJO.md`](doc/FLUJO.md).
Hay un proyecto de demostración en
[`examples/equipo-solo-node/README.es.md`](https://github.com/fernando-delrio/lead-flow/blob/main/examples/equipo-solo-node/README.es.md).

## Límites

- Los agentes ayudan a aplicar el flujo; no sustituyen las pruebas ni la revisión de una persona.
- Git sigue en manos de la persona: los agentes proponen comandos, pero no publican cambios.
- Cada agente añade contexto y consumo cuando se invoca. `claude plugin details` muestra una
  estimación para la versión instalada.
- `lead-flow`, el flujo para equipos, sigue en construcción y no forma parte de esta release.
