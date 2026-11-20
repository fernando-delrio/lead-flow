import type { Policy } from '../../policy/schema.js'
import type { RenderedFile } from './types.js'

const PROTECTED_PATHS = ['.lead/', '.github/workflows/']

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
