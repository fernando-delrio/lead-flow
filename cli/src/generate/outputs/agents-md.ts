import type { Policy } from '../../policy/schema.js'
import { renderCode, renderLabeled, renderList, renderSection } from './sections.js'
import type { RenderedFile } from './types.js'

export const AGENTS_PATH = 'AGENTS.md'

const CONTROL_QUESTION =
  '**Pregunta de control antes de dar algo por terminado:** ¿lo pondría delante del cliente ahora mismo, sin avisar de nada? Si la respuesta es «sí, pero…», no está terminado.'

const WORKING_RULES = [
  'Incrementos pequeños que conectan backend y frontend. Prueba antes que código en la lógica.',
  '**Git es de la persona**: el agente propone los comandos, nunca los ejecuta.',
  'Al terminar un incremento: parar, resumir y esperar la señal.',
  'Primero la spec (`specs/NNN-*/`, requisitos EARS), luego plan, tareas y código.',
]

const LIMITS = [
  '✅ Siempre: leer antes de editar, ejecutar las pruebas que toques.',
  '⚠️ Pregunta antes: dependencias nuevas, migraciones ya aplicadas, configuración de despliegue.',
  '🚫 Nunca: Git, credenciales en el código, dar por hecho algo que no has ejecutado.',
]

const VERIFICATION =
  'Pruebas y lint en verde, documentación al día, diff pequeño. Las puertas de revisión de la pull request comprueban lo que una máquina puede comprobar.'

const renderStack = (policy: Policy) => {
  const { lenguajes, frameworks, comandos } = policy.stack
  return renderSection('Stack y comandos', [
    ...renderLabeled('Lenguajes', lenguajes),
    ...renderLabeled('Frameworks', frameworks),
    '- **Probar** (los agentes usan estas líneas, mantenlas exactas):',
    `  ${renderCode(comandos.pruebas)} · ${renderCode(comandos.lint)} · ${renderCode(comandos.build)}.`,
  ])
}

const renderDependencies = (policy: Policy) => {
  const { ecosistema, permitidas, prohibidas, licencias_permitidas } = policy.dependencias
  return renderSection('Dependencias', [
    `- Ecosistema: ${ecosistema}.`,
    ...renderLabeled('Permitidas', permitidas),
    ...renderLabeled('Prohibidas', prohibidas),
    ...renderLabeled('Licencias permitidas', licencias_permitidas),
  ])
}

const renderAuthentication = (authentication: string) => {
  if (authentication.trim() === '') return []
  return [`- Autenticación: ${authentication}.`]
}

const renderSecurity = (policy: Policy) => {
  const { autenticacion, requisitos } = policy.seguridad
  return renderSection('Seguridad', [...renderAuthentication(autenticacion), ...renderList(requisitos)])
}

const renderRisk = (policy: Policy) => {
  const { alto, bajo } = policy.riesgo
  const { aprobacion } = policy
  return renderSection('Riesgo y aprobación', [
    ...renderLabeled('Riesgo alto (más revisión)', alto),
    ...renderLabeled('Riesgo bajo', bajo),
    `- Aprobación: bajo → ${aprobacion.bajo}, medio → ${aprobacion.medio}, alto → ${aprobacion.alto}.`,
  ])
}

const renderBranches = (policy: Policy) =>
  renderSection('Ramas', [
    `- Rama principal: ${renderCode(policy.ramas.principal)}.`,
    `- Patrón de nombre: ${renderCode(policy.ramas.patron)}.`,
  ])

export const renderAgentsMd = (policy: Policy): RenderedFile => ({
  path: AGENTS_PATH,
  style: 'markdown',
  content: [
    `# AGENTS.md — ${policy.proyecto.nombre}`,
    '',
    CONTROL_QUESTION,
    '',
    ...renderStack(policy),
    ...renderDependencies(policy),
    ...renderSecurity(policy),
    ...renderRisk(policy),
    ...renderBranches(policy),
    ...renderSection('Forma de trabajar', renderList(WORKING_RULES)),
    ...renderSection('Límites', renderList(LIMITS)),
    ...renderSection('Verificación antes de dar algo por terminado', [VERIFICATION]),
  ].join('\n'),
})
