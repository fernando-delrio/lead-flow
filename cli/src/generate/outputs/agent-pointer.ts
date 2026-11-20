import type { Policy } from '../../policy/schema.js'
import { AGENTS_PATH } from './agents-md.js'
import { renderCode } from './sections.js'

export const renderAgentPointer = (title: string, policy: Policy) => {
  const { pruebas, lint, build } = policy.stack.comandos
  return [
    `# ${title} — ${policy.proyecto.nombre}`,
    '',
    `Sigue las reglas de ${renderCode(AGENTS_PATH)} en la raíz del repositorio.`,
    `Comandos para probar: ${renderCode(pruebas)}, ${renderCode(lint)} y ${renderCode(build)}.`,
    'Git es de la persona: propón los comandos, no los ejecutes.',
  ].join('\n')
}
