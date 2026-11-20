import { PROTECTED_DIRECTORIES, TOOL_CONFIG_FILES } from '../../core/constants.js'
import type { Policy } from '../../policy/schema.js'
import type { RenderedFile } from './types.js'

// Sin barra delante, CODEOWNERS aplica cada archivo de configuración en cualquier carpeta.
const PROTECTED_PATHS = [...PROTECTED_DIRECTORIES, ...TOOL_CONFIG_FILES]

const toHandle = (person: string) => `@${person.replace(/^@/, '')}`

const listOwners = (policy: Policy) => {
  const { lead, scrum_master } = policy.equipo
  const people = [lead, scrum_master].filter((person) => person.trim() !== '')
  return [...new Set(people.map(toHandle))]
}

export const renderCodeowners = (policy: Policy): RenderedFile => {
  const owners = listOwners(policy).join(' ')
  return {
    path: '.github/CODEOWNERS',
    style: 'hash',
    content: PROTECTED_PATHS.map((path) => `${path} ${owners}`).join('\n'),
  }
}
