import { posix } from 'node:path'
import { PROTECTED_DIRECTORIES, TOOL_CONFIG_FILES } from '../core/constants.js'
import { CLI_VERSION } from '../core/version.js'
import { planWrite } from '../generate/blocks.js'
import type { RenderedFile } from '../generate/outputs/types.js'
import type { GateEvidence, Policy, Review } from '../policy/schema.js'
import { createEvidence } from './evidence.js'

// generatedOnBase lleva también el estilo de comentario para comparar solo el bloque gestionado.
export type IntegrityInput = {
  policy: Policy
  changedFiles: string[]
  generatedOnBase: RenderedFile[]
  filesOnHead: Record<string, string>
  approvals: Review[]
  author: string
}

type Findings = {
  approver: string | null
  isApproved: boolean
  changedProtected: string[]
  unapproved: string[]
  drifted: string[]
}

export const INTEGRITY_GATE = 'integridad'
const TOOL_NAME = 'lead-flow'
const DECISIVE_STATES: Array<Review['estado']> = ['APPROVED', 'CHANGES_REQUESTED']

const sameUser = (first: string, second: string) => first.toLowerCase() === second.toLowerCase()

export const isProtectedPath = (path: string, generatedPaths: string[]) =>
  PROTECTED_DIRECTORIES.some((directory) => path.startsWith(directory)) ||
  TOOL_CONFIG_FILES.includes(posix.basename(path)) ||
  generatedPaths.includes(path)

// Cambiar el flujo lo aprueba la lead; si la pull request es de la lead, el scrum master.
export const requiredApprover = (policy: Policy, author: string): string | null => {
  const { lead, scrum_master } = policy.equipo
  if (!sameUser(lead, author)) return lead
  if (scrum_master === '' || sameUser(scrum_master, author)) return null
  return scrum_master
}

// Como en GitHub, cuenta la última reseña que aprueba o pide cambios; un comentario no la anula.
const latestDecision = (approvals: Review[], person: string) =>
  approvals
    .filter((review) => sameUser(review.usuario, person) && DECISIVE_STATES.includes(review.estado))
    .sort((first, second) => Date.parse(first.fecha) - Date.parse(second.fecha))
    .at(-1)

const hasApproval = (approvals: Review[], approver: string | null) => {
  if (approver === null) return false
  return latestDecision(approvals, approver)?.estado === 'APPROVED'
}

const matchesGenerated = (file: RenderedFile, onHead: string | undefined) => {
  if (onHead === undefined) return false
  return planWrite(onHead, file.content, file.style).estado === 'sin_cambios'
}

const findDrift = (input: IntegrityInput) =>
  input.generatedOnBase
    .filter((file) => !matchesGenerated(file, input.filesOnHead[file.path]))
    .map((file) => file.path)

const listUnapproved = (input: IntegrityInput, approver: string | null, changedProtected: string[]) => {
  if (hasApproval(input.approvals, approver)) return []
  return changedProtected
}

// La aprobación solo cubre lo que cambia esta pull request; un desfase previo de la base sigue fallando.
const collectFindings = (input: IntegrityInput): Findings => {
  const generatedPaths = input.generatedOnBase.map((file) => file.path)
  const changedProtected = input.changedFiles.filter((path) => isProtectedPath(path, generatedPaths))
  const approver = requiredApprover(input.policy, input.author)
  const isApproved = hasApproval(input.approvals, approver)
  const isCovered = (path: string) => isApproved && input.changedFiles.includes(path)
  return {
    approver,
    isApproved,
    changedProtected,
    unapproved: listUnapproved(input, approver, changedProtected),
    drifted: findDrift(input).filter((path) => !isCovered(path)),
  }
}

const describeApprover = (approver: string | null) => {
  if (approver === null) {
    return 'quien abre la pull request es la lead y la política no tiene otro scrum master que pueda aprobar'
  }
  return `falta la aprobación de @${approver} en el último commit`
}

type ProblemKind = { pick: (findings: Findings) => string[]; describe: (paths: string, findings: Findings) => string }

const PROBLEM_KINDS: ProblemKind[] = [
  {
    pick: (findings) => findings.unapproved,
    describe: (paths, findings) => `Cambios en archivos protegidos sin aprobar (${describeApprover(findings.approver)}): ${paths}.`,
  },
  {
    pick: (findings) => findings.drifted,
    describe: (paths) =>
      `Archivos generados que no coinciden con la política de la rama base: ${paths}. Ejecuta «lead-flow generar» y pide la aprobación que corresponda.`,
  },
]

const describeProblems = (findings: Findings) =>
  PROBLEM_KINDS.filter((kind) => kind.pick(findings).length > 0).map((kind) =>
    kind.describe(kind.pick(findings).join(', '), findings)
  )

const describeSuccess = (findings: Findings) => {
  if (findings.changedProtected.length > 0) {
    return `Integridad correcta: los cambios en archivos protegidos tienen la aprobación de @${findings.approver}.`
  }
  return 'Integridad correcta: ningún archivo protegido cambia y los archivos generados coinciden con la política de la rama base.'
}

const toDetails = (findings: Findings) => [
  ...findings.unapproved.map((archivo) => ({ tipo: 'cambio_protegido_sin_aprobar', archivo })),
  ...findings.drifted.map((archivo) => ({ tipo: 'generado_distinto', archivo })),
]

export const checkIntegrity = (input: IntegrityInput): GateEvidence => {
  const findings = collectFindings(input)
  const problems = describeProblems(findings)
  const base = { puerta: INTEGRITY_GATE, herramienta: TOOL_NAME, version: CLI_VERSION, detalles: toDetails(findings) }
  if (problems.length > 0) return createEvidence({ ...base, estado: 'fallo', resumen: problems.join(' ') })
  return createEvidence({ ...base, estado: 'ok', resumen: describeSuccess(findings) })
}
