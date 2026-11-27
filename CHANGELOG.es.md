# Historial de cambios

[English](CHANGELOG.md) · [Español](CHANGELOG.es.md)

Los cambios relevantes de cada entrega pública se documentan en este archivo.

## Sin publicar

### Cambiado

- El inglés pasa a ser el idioma principal de las instrucciones de agentes, plantillas,
  documentación del flujo, evaluaciones y metadatos públicos del paquete.
- Los identificadores se mantienen estables y los agentes responden en el idioma de quien los
  invoca. Las plantillas españolas siguen disponibles con el sufijo `.es.md`.

## Equipo Solo 0.1.0 — 2026-11-27

### Añadido

- Siete agentes para planificar, implementar, revisar y cerrar incrementos.
- Puertas separadas de seguridad, rendimiento y diseño.
- Plantillas `AGENTS.md` y `CLAUDE.md` para adaptar el flujo a cada proyecto.
- Seis casos de evaluación con sus criterios.
- Documentación de las decisiones y límites del flujo.
- Ejemplo Node sin dependencias para probar el recorrido.
- Icono de publicación con una persona central y siete agentes coordinados.
- Vídeo de presentación en español, con proyecto de render reproducible y subtítulos.

### Límites conocidos

- La licencia y el aviso se consultan en la raíz del repositorio; aún no viajan dentro de la
  carpeta instalada del plugin.
- El CLI `lead-flow` para equipos sigue en construcción y no forma parte de esta entrega.
