import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { attemptSync } from '../../src/core/attempt.js'
import { validatePolicy } from '../../src/policy/schema.js'

const readFixture = () =>
  parse(readFileSync(new URL('../fixtures/politica-valida.yml', import.meta.url), 'utf8'))

const failureMessage = (raw: unknown) => attemptSync(() => validatePolicy(raw)).error?.message

describe('validatePolicy', () => {
  it('accepts the valid fixture', () => {
    const policy = validatePolicy(readFixture())
    expect(policy.proyecto.nombre).toBe('Tienda de ejemplo')
  })

  it('rejects a misspelled key naming it', () => {
    const { aprobacion, ...rest } = readFixture()
    const message = failureMessage({ ...rest, aprovacion: aprobacion })
    expect(message).toContain('"aprovacion"')
    expect(message).toContain('"aprobacion"')
  })

  it('rejects an empty command naming the key', () => {
    const raw = readFixture()
    const stack = { ...raw.stack, comandos: { ...raw.stack.comandos, build: '' } }
    const message = failureMessage({ ...raw, stack })
    expect(message).toContain('stack.comandos.build: se esperaba un texto no vacío')
  })

  it('rejects an unknown approver listing the allowed ones', () => {
    const raw = readFixture()
    const message = failureMessage({ ...raw, aprobacion: { ...raw.aprobacion, alto: 'jefe' } })
    expect(message).toContain('automatica, companero, qa, delegado, lead')
    expect(message).toContain('aprobacion.alto')
  })

  it('lists the valid keys when none is close', () => {
    const message = failureMessage({ ...readFixture(), zzzzzzzzzz: 1 })
    expect(message).toContain('Claves válidas')
  })

  it('names the wrong type and the expected one', () => {
    const raw = readFixture()
    const message = failureMessage({ ...raw, riesgo: { ...raw.riesgo, muestreo_1_de: 'diez' } })
    expect(message).toContain('riesgo.muestreo_1_de')
    expect(message).toContain('número entero')
  })

  it('rejects something that is not a mapping', () => {
    expect(failureMessage('hola')).toContain('bloque de claves')
  })
})

describe('validatePolicy text safety', () => {
  const withEquipo = (patch: Record<string, unknown>) => {
    const raw = readFixture()
    return { ...raw, equipo: { ...raw.equipo, ...patch } }
  }

  it('rejects a lead that is not a GitHub username, naming the key', () => {
    expect(failureMessage(withEquipo({ lead: 'ana\n* @otro' }))).toContain('equipo.lead')
    expect(failureMessage(withEquipo({ lead: 'ana lead' }))).toContain('equipo.lead')
  })

  it('rejects an invalid qa entry and delegate person', () => {
    expect(failureMessage(withEquipo({ qa: ['ok-qa', '-mal'] }))).toContain('equipo.qa[1]')
    const delegados = [{ tema: 'pagos', persona: 'a b' }]
    expect(failureMessage(withEquipo({ delegados }))).toContain('equipo.delegados[0].persona')
  })

  it('accepts a leading @ and normalises it away', () => {
    const policy = validatePolicy(withEquipo({ lead: '@ana-lead', qa: ['@marta-qa'] }))
    expect(policy.equipo.lead).toBe('ana-lead')
    expect(policy.equipo.qa).toEqual(['marta-qa'])
  })

  it('rejects a newline in any text, naming the key', () => {
    const raw = readFixture()
    const message = failureMessage({ ...raw, proyecto: { ...raw.proyecto, nombre: 'a\nb' } })
    expect(message).toContain('proyecto.nombre')
    expect(message).toContain('salto de línea')
  })

  it('rejects the managed block markers inside a text', () => {
    const raw = readFixture()
    const requisitos = ['<!-- lead-flow:fin -->']
    const message = failureMessage({ ...raw, seguridad: { ...raw.seguridad, requisitos } })
    expect(message).toContain('seguridad.requisitos[0]')
    expect(message).toContain('lead-flow:fin')
  })
})
