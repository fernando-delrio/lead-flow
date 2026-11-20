import type { Policy } from '../../policy/schema.js'
import { renderAgentPointer } from './agent-pointer.js'
import type { RenderedFile } from './types.js'

export const renderCursor = (policy: Policy): RenderedFile => ({
  path: '.cursor/rules/lead-flow.mdc',
  style: 'mdc',
  content: renderAgentPointer('Reglas de Cursor', policy),
})
