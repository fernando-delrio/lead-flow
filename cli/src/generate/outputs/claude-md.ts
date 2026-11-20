import type { Policy } from '../../policy/schema.js'
import { AGENTS_PATH } from './agents-md.js'
import type { RenderedFile } from './types.js'

export const renderClaudeMd = (policy: Policy): RenderedFile => ({
  path: 'CLAUDE.md',
  style: 'markdown',
  content: [
    `@${AGENTS_PATH}`,
    '',
    `# CLAUDE.md — ${policy.proyecto.nombre}`,
    '',
    `Las reglas comunes están en \`${AGENTS_PATH}\` (importado arriba). Aquí solo lo que aplica a Claude Code.`,
  ].join('\n'),
})
