import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { attempt } from '../../src/core/attempt.js'
import { LeadFlowError } from '../../src/core/errors.js'
import { readEvidence, readGateEvidence, writeEvidence } from '../../src/gates/evidence.js'
import type { GateEvidence } from '../../src/policy/schema.js'

const evidence = (overrides: Partial<GateEvidence> = {}): GateEvidence => ({
  puerta: 'secretos',
  estado: 'ok',
  resumen: 'gitleaks no ha encontrado secretos.',
  herramienta: 'gitleaks',
  version: '8.30.1',
  fecha: '2026-11-19T10:00:00.000Z',
  detalles: [],
  ...overrides,
})

const temporaryDirectory = () => mkdtemp(join(tmpdir(), 'lead-flow-evidencias-'))

const readError = async (directory: string) => (await attempt(readEvidence(directory))).error

const gateError = async (directory: string, gate: string) => (await attempt(readGateEvidence(directory, gate))).error

const MULTIBYTE_CHARACTER = '\u00F1'
const OVER_LIMIT_IN_CHARACTERS = 500_001

describe('evidence', () => {
  it('evidence round-trips through write and read', async () => {
    const directory = await temporaryDirectory()
    const secrets = evidence({ detalles: [{ regla: 'aws', archivo: 'a.ts', linea: 1 }] })
    const tests = evidence({ puerta: 'pruebas', estado: 'fallo', herramienta: 'comandos de la política' })
    await writeEvidence(directory, secrets)
    await writeEvidence(directory, tests)
    expect(await readEvidence(directory)).toEqual([tests, secrets])
  })

  it('rejects a file with a missing field', async () => {
    const directory = await temporaryDirectory()
    const incomplete = Object.fromEntries(Object.entries(evidence()).filter(([key]) => key !== 'version'))
    await writeFile(join(directory, 'secretos.json'), JSON.stringify(incomplete), 'utf8')
    const error = await readError(directory)
    expect(error).toBeInstanceOf(LeadFlowError)
    expect((error as LeadFlowError).code).toBe('EVIDENCIA_INVALIDA')
    expect(error?.message).toContain('version')
  })

  it('rejects unknown keys, a wrong state and details that are not a list', async () => {
    const directory = await temporaryDirectory()
    const malformed = { ...evidence(), estado: 'aprobado', detalles: 'ninguno', aprobado: true }
    await writeFile(join(directory, 'secretos.json'), JSON.stringify(malformed), 'utf8')
    const error = await readError(directory)
    expect((error as LeadFlowError).code).toBe('EVIDENCIA_INVALIDA')
    expect(error?.message).toContain('aprobado')
    expect(error?.message).toContain('estado')
    expect(error?.message).toContain('detalles')
  })

  it('rejects a file that is not JSON', async () => {
    const directory = await temporaryDirectory()
    await writeFile(join(directory, 'secretos.json'), '{ sin cerrar', 'utf8')
    expect(((await readError(directory)) as LeadFlowError).code).toBe('EVIDENCIA_INVALIDA')
  })

  it('rejects evidence filed under the name of another gate', async () => {
    const directory = await temporaryDirectory()
    await writeFile(join(directory, 'integridad.json'), JSON.stringify(evidence()), 'utf8')
    const error = await readError(directory)
    expect((error as LeadFlowError).code).toBe('EVIDENCIA_INVALIDA')
    expect(error?.message).toContain('integridad.json')
  })

  it('refuses to write evidence whose gate name is not a plain name', async () => {
    const directory = await temporaryDirectory()
    const { error } = await attempt(writeEvidence(directory, evidence({ puerta: '../fuera' })))
    expect((error as LeadFlowError).code).toBe('EVIDENCIA_INVALIDA')
  })

  it('reports a missing directory as a LeadFlowError', async () => {
    const error = await readError(join(tmpdir(), 'lead-flow-no-existe-nunca'))
    expect(error).toBeInstanceOf(LeadFlowError)
  })

  it('measures the size in bytes before reading the file', async () => {
    const directory = await temporaryDirectory()
    await writeFile(join(directory, 'secretos.json'), MULTIBYTE_CHARACTER.repeat(OVER_LIMIT_IN_CHARACTERS), 'utf8')
    const error = await readError(directory)
    expect((error as LeadFlowError).code).toBe('EVIDENCIA_INVALIDA')
    expect(error?.message).toContain('demasiado grande')
  })
})

describe('readGateEvidence', () => {
  it('reads only the file of the gate it is asked for', async () => {
    const directory = await temporaryDirectory()
    await writeEvidence(directory, evidence())
    await writeFile(join(directory, 'otra.json'), '{ roto', 'utf8')
    expect(await readGateEvidence(directory, 'secretos')).toEqual(evidence())
  })

  it('rejects a file that says it belongs to another gate', async () => {
    const directory = await temporaryDirectory()
    await writeFile(join(directory, 'integridad.json'), JSON.stringify(evidence()), 'utf8')
    const error = await gateError(directory, 'integridad')
    expect((error as LeadFlowError).code).toBe('EVIDENCIA_INVALIDA')
    expect(error?.message).toContain('secretos')
  })

  it('rejects a gate name that is not a plain name', async () => {
    const error = await gateError(await temporaryDirectory(), '../secretos')
    expect((error as LeadFlowError).code).toBe('EVIDENCIA_INVALIDA')
  })
})
