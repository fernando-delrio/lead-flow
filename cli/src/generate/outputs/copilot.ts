import type { Policy } from '../../policy/schema.js'
import { renderAgentPointer } from './agent-pointer.js'
import type { RenderedFile } from './types.js'

export const renderCopilot = (policy: Policy): RenderedFile => ({
  path: '.github/copilot-instructions.md',
  style: 'markdown',
  content: renderAgentPointer('Instrucciones para Copilot', policy),
})
