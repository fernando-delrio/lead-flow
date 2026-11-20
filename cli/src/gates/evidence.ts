import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { attempt, attemptSync } from '../core/attempt.js'
import { LeadFlowError } from '../core/errors.js'
import type { GateEvidence, GateStatus } from '../policy/schema.js'

const INVALID_EVIDENCE_CODE = 'EVIDENCIA_INVALIDA'
const UNREADABLE_EVIDENCE_CODE = 'EVIDENCIA_ILEGIBLE'
const EVIDENCE_EXTENSION = '.json'
const GATE_NAME_PATTERN = /^[a-z][a-z-]{0,39}$/
// Las evidencias llegan como artefactos de jobs que ejecutan código de la pull request.
const MAX_EVIDENCE_CHARACTERS = 1_000_000
const JSON_INDENT = 2
const GATE_STATUSES: GateStatus[] = ['ok', 'fallo', 'no_verificado']
const TEXT_FIELDS = ['puerta', 'resumen', 'herramienta', 'version', 'fecha']
const EVIDENCE_FIELDS = [...TEXT_FIELDS, 'estado', 'detalles']

export type EvidenceFields = Omit<GateEvidence, 'fecha'>

export const createEvidence = (fields: EvidenceFields): GateEvidence => ({
  ...fields,
  fecha: new Date().toISOString(),
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const describeFieldProblems = (value: Record<string, unknown>) => [
  ...Object.keys(value)
    .filter((key) => !EVIDENCE_FIELDS.includes(key))
    .map((key) => `la clave «${key}» no existe`),
  ...TEXT_FIELDS.filter((key) => typeof value[key] !== 'string').map((key) => `«${key}» debe ser un texto`),
  ...[value.estado]
    .filter((status) => !GATE_STATUSES.includes(status as GateStatus))
    .map(() => `«estado» debe ser uno de ${GATE_STATUSES.join(', ')}`),
  ...[value.detalles].filter((details) => !Array.isArray(details)).map(() => '«detalles» debe ser una lista'),
  ...[value.puerta]
    .filter((gate) => typeof gate === 'string' && !GATE_NAME_PATTERN.test(gate))
    .map(() => '«puerta» solo admite letras minúsculas y guiones'),
]

const describeShapeProblems = (value: unknown): string[] => {
  if (!isRecord(value)) return ['no es un objeto JSON']
  return describeFieldProblems(value)
}

const rejectEvidence = (place: string, problems: string[]): never => {
  throw new LeadFlowError(
    INVALID_EVIDENCE_CODE,
    `La evidencia ${place} no tiene el formato esperado: ${problems.join('; ')}.`
  )
}

const validateEvidence = (value: unknown, place: string): GateEvidence => {
  const problems = describeShapeProblems(value)
  if (problems.length > 0) return rejectEvidence(place, problems)
  return value as GateEvidence
}

const parseEvidence = (text: string, place: string) => {
  if (text.length > MAX_EVIDENCE_CHARACTERS) return rejectEvidence(place, ['es demasiado grande'])
  const { value, error } = attemptSync(() => JSON.parse(text) as unknown)
  if (error) return rejectEvidence(place, [`no es un JSON válido (${error.message})`])
  return validateEvidence(value, place)
}

const evidenceFileName = (gate: string) => `${gate}${EVIDENCE_EXTENSION}`

export const writeEvidence = async (directory: string, evidence: GateEvidence): Promise<void> => {
  const valid = validateEvidence(evidence, `de la puerta «${evidence.puerta}»`)
  await mkdir(directory, { recursive: true })
  const text = `${JSON.stringify(valid, null, JSON_INDENT)}\n`
  await writeFile(join(directory, evidenceFileName(valid.puerta)), text, 'utf8')
}

// Una evidencia guardada con el nombre de otra puerta se rechaza: no puede hacerse pasar por ella.
const readEvidenceFile = async (directory: string, file: string) => {
  const { value: text, error } = await attempt(readFile(join(directory, file), 'utf8'))
  if (error) throw new LeadFlowError(UNREADABLE_EVIDENCE_CODE, `No se puede leer la evidencia ${file}: ${error.message}`)
  const evidence = parseEvidence(text, file)
  if (evidenceFileName(evidence.puerta) === file) return evidence
  return rejectEvidence(file, [`dice ser de la puerta «${evidence.puerta}»`])
}

export const readEvidence = async (directory: string): Promise<GateEvidence[]> => {
  const { value: entries, error } = await attempt(readdir(directory))
  if (error) {
    throw new LeadFlowError(UNREADABLE_EVIDENCE_CODE, `No se puede leer la carpeta de evidencias ${directory}: ${error.message}`)
  }
  const files = entries.filter((entry) => entry.endsWith(EVIDENCE_EXTENSION)).sort()
  return Promise.all(files.map((file) => readEvidenceFile(directory, file)))
}
