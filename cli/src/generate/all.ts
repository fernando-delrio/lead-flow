import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { attempt } from '../core/attempt.js'
import { LeadFlowError } from '../core/errors.js'
import { MANAGED_BLOCK_END, MANAGED_BLOCK_START } from '../core/constants.js'
import type { Policy } from '../policy/schema.js'
import { type WriteOutcome, planWrite } from './blocks.js'
import { type PendingFile, writeAtomically } from './commit.js'
import { renderAgentsMd } from './outputs/agents-md.js'
import { renderClaudeMd } from './outputs/claude-md.js'
import { renderCodeowners } from './outputs/codeowners.js'
import { renderCopilot } from './outputs/copilot.js'
import { renderCursor } from './outputs/cursor.js'
import {
  renderExceptionTemplate,
  renderProductionFailureTemplate,
  renderPullRequestTemplate,
} from './outputs/templates.js'
import type { RenderedFile } from './outputs/types.js'
import { renderWorkflows } from './outputs/workflows.js'

export type FileOutcome = WriteOutcome & { path: string }
type Plan = FileOutcome & PendingFile
export type GenerateReport = { text: string; hasConflict: boolean }

const RENDERERS: Array<(policy: Policy) => RenderedFile | RenderedFile[]> = [
  renderAgentsMd,
  renderClaudeMd,
  renderCopilot,
  renderCursor,
  renderCodeowners,
  renderExceptionTemplate,
  renderProductionFailureTemplate,
  renderPullRequestTemplate,
  renderWorkflows,
]

const NO_FILE_CODE = 'ENOENT'
const READ_FAILED_CODE = 'LECTURA_FALLIDA'

const readCurrent = async (absolute: string) => {
  const { value, error } = await attempt(readFile(absolute, 'utf8'))
  if (!error) return value
  if ((error as NodeJS.ErrnoException).code === NO_FILE_CODE) return null
  throw new LeadFlowError(READ_FAILED_CODE, `No se puede leer ${absolute}: ${error.message}`)
}

const planFile = async (directory: string, file: RenderedFile): Promise<Plan> => {
  const absolute = join(directory, file.path)
  const previous = await readCurrent(absolute)
  const plan = planWrite(previous, file.content, file.style)
  return { ...plan, path: file.path, absolute, previous }
}

const toOutcome = ({ path, estado, diferencia }: Plan): FileOutcome => ({ path, estado, diferencia })

const isChanged = (plan: Plan) => plan.estado === 'creado' || plan.estado === 'actualizado'

const renderAll = (policy: Policy) => RENDERERS.flatMap((render) => render(policy))

export const generateAll = async (directory: string, policy: Policy): Promise<FileOutcome[]> => {
  const plans = await Promise.all(renderAll(policy).map((file) => planFile(directory, file)))
  if (plans.some((plan) => plan.estado === 'conflicto')) return plans.map(toOutcome)
  await writeAtomically(plans.filter(isChanged))
  return plans.map(toOutcome)
}

export const hasConflict = (outcomes: WriteOutcome[]) =>
  outcomes.some((outcome) => outcome.estado === 'conflicto')

const CONFLICT_HELP = [
  'Los archivos en conflicto tienen texto escrito a mano. Para que lead-flow pueda escribir, añade los marcadores',
  `<!-- ${MANAGED_BLOCK_START} --> / <!-- ${MANAGED_BLOCK_END} --> (o # ${MANAGED_BLOCK_START} / # ${MANAGED_BLOCK_END} si el archivo usa #)`,
  'donde quieras que escriba.',
]

const describeConflictOutcome = ({ path, estado, diferencia }: FileOutcome) => {
  if (estado === 'sin_cambios') return `sin cambios: ${path}`
  if (estado !== 'conflicto') return `pendiente: ${path}`
  return [`conflicto: ${path}`, diferencia].join('\n')
}

const describeConflict = (outcomes: FileOutcome[]) =>
  ['No se ha escrito ningún archivo.', ...outcomes.map(describeConflictOutcome), ...CONFLICT_HELP].join('\n')

export const describeOutcomes = (outcomes: FileOutcome[]) => {
  if (hasConflict(outcomes)) return describeConflict(outcomes)
  return outcomes.map(({ path, estado }) => `${estado}: ${path}`).join('\n')
}

export const generateReport = async (directory: string, policy: Policy): Promise<GenerateReport> => {
  const outcomes = await generateAll(directory, policy)
  return { text: describeOutcomes(outcomes), hasConflict: hasConflict(outcomes) }
}
