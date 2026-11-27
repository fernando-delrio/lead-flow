# Guion de demostración de Equipo Solo

Objetivo: enseñar en unos 90 segundos qué problema resuelve el plugin y cómo se comprueba el
resultado, sin fingir tiempos de ejecución ni ocultar pasos.

## Preparación

1. Usa una terminal limpia y aumenta el tamaño de letra.
2. Cierra ventanas con cuentas, rutas privadas o notificaciones.
3. Instala el plugin y abre `examples/equipo-solo-node/`.
4. Ejecuta `npm test` y conserva la salida inicial: dos pruebas aprobadas.
5. Prepara una sesión de Claude Code nueva y comprueba `/agents`.

## Plano a plano

| Tiempo | Pantalla | Voz o texto |
|---:|---|---|
| 0–12 s | README y problema del ejemplo. | «Programar con IA es rápido; revisar todo lo que produce no lo es.» |
| 12–25 s | Instalación y `claude plugin details`. | «Equipo Solo separa planificación, implementación, revisión y puertas de calidad.» |
| 25–38 s | `/agents`, con los siete agentes. | «Cada agente tiene una responsabilidad y Git sigue en manos de la persona.» |
| 38–55 s | Pegar el encargo de envío gratuito. | «Le damos una tarea pequeña, con un límite comprobable.» |
| 55–72 s | Cortes reales del plan, implementación y revisión. | «El implementador no se da a sí mismo el visto bueno.» |
| 72–84 s | `npm test`, lint y build en verde. | «El cierre se apoya en pruebas ejecutadas, no en que el agente diga que terminó.» |
| 84–90 s | URL del repositorio. | «Está publicado con licencia Apache 2.0 y busca pruebas y contribuciones.» |

## Encargo que se muestra

```text
Lee AGENTS.md y CLAUDE.md. Añade envío gratuito cuando el subtotal sea de 50 euros o más.
Incluye el caso exacto de 50 euros, conserva el envío de 4,99 euros por debajo y no hagas Git.
Usa el flujo de agentes y para al cerrar el incremento.
```

## Evidencias que deben verse

- la salida real de `claude plugin details equipo-solo@equipo-solo`;
- los nombres de los agentes en `/agents`;
- el diff del ejemplo, sin cortes que oculten archivos;
- pruebas, lint y build ejecutados al final;
- cualquier límite o aviso que aparezca durante la sesión.

## Revisión antes de publicar

- No aparecen credenciales, nombres de clientes ni rutas personales.
- Los subtítulos coinciden con lo ocurrido y se leen sin sonido.
- La descripción enlaza la release, el ejemplo y la guía de contribución.
- No se afirma que `lead-flow` esté terminado ni que los agentes eviten todos los fallos.
