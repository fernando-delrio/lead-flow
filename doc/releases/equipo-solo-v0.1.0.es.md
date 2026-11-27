# Equipo Solo 0.1.0

[English](equipo-solo-v0.1.0.md) · [Español](equipo-solo-v0.1.0.es.md)

Primera entrega pública del plugin `equipo-solo` para Claude Code.

## Qué incluye

- Planificador e implementador con responsabilidades separadas.
- Revisor independiente del implementador.
- Puertas de seguridad y rendimiento.
- Revisión de diseño para cambios visuales.
- Cierre de incremento que comprueba pruebas, documentación y trabajo pendiente.
- Plantillas para trasladar las reglas reales de un proyecto a los agentes.

## Instalar

```bash
claude plugin marketplace add fernando-delrio/lead-flow
claude plugin install equipo-solo@equipo-solo
claude plugin details equipo-solo@equipo-solo
```

## Comprobaciones realizadas

- `claude plugin validate ./plugin --strict`: validación aprobada.
- `claude plugin validate . --strict`: marketplace válido.
- Instalación desde `fernando-delrio/lead-flow` en una configuración temporal: versión `0.1.0`,
  plugin activo y siete agentes cargados.
- Suite del CLI: 221 pruebas, lint y build aprobados antes de preparar la entrega.

## Probar el recorrido

Sigue [`examples/equipo-solo-node/README.es.md`](../../examples/equipo-solo-node/README.es.md). El ejemplo
usa únicamente Node.js y no instala dependencias.

## Vídeo

La presentación pública está preparada en
[`assets/releases/equipo-solo-v0.1.0.mp4`](../../assets/releases/equipo-solo-v0.1.0.mp4).
Dura 68,60 segundos e incluye voz en español de España, gráficos, música original y subtítulos.
El proyecto reproducible vive en [`video/equipo-solo-v0.1.0/`](../../video/equipo-solo-v0.1.0/).

## Qué no incluye

Esta release no publica el CLI `lead-flow`, sus puertas de GitHub ni el flujo para equipos. Esas
piezas siguen en fase 1 dentro del mismo repositorio.

## Etiqueta

La etiqueta propuesta es `equipo-solo-v0.1.0`. Se crea solo después de integrar y volver a
verificar este incremento sobre `main`.
