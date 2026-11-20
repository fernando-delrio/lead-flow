import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'
import { attempt } from '../../src/core/attempt.js'
import { LeadFlowError } from '../../src/core/errors.js'
import { describeOutcomes, generateAll, generateReport } from '../../src/generate/all.js'
import { renderAgentsMd } from '../../src/generate/outputs/agents-md.js'
import { renderClaudeMd } from '../../src/generate/outputs/claude-md.js'
import { renderCodeowners } from '../../src/generate/outputs/codeowners.js'
import { renderCopilot } from '../../src/generate/outputs/copilot.js'
import { renderCursor } from '../../src/generate/outputs/cursor.js'
import { renderExceptionTemplate } from '../../src/generate/outputs/templates.js'
import { type Policy, validatePolicy } from '../../src/policy/schema.js'

const renameControl = vi.hoisted(() => ({ failOn: '', failWriteOn: '' }))

vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs/promises')>()
  return {
    ...original,
    writeFile: async (...args: Parameters<typeof original.writeFile>) => {
      const target = String(args[0])
      if (renameControl.failWriteOn !== '' && target.endsWith(renameControl.failWriteOn)) {
        throw new Error('escritura forzada')
      }
      return original.writeFile(...args)
    },
    rename: async (from: string, to: string) => {
      if (renameControl.failOn !== '' && to.endsWith(renameControl.failOn)) throw new Error('fallo forzado')
      return original.rename(from, to)
    },
  }
})

const fixturePolicy = (): Policy =>
  validatePolicy(parse(readFileSync(new URL('../fixtures/politica-valida.yml', import.meta.url), 'utf8')))

const temporaryDirectory = () => mkdtemp(join(tmpdir(), 'lead-flow-'))

describe('generated outputs', () => {
  it('AGENTS.md lists the test commands exactly as in the policy', () => {
    const { content } = renderAgentsMd(fixturePolicy())
    expect(content).toContain('`npm test` · `npm run lint` · `npm run build`')
  })

  it('AGENTS.md leaves out sections the policy has nothing for', () => {
    const policy = fixturePolicy()
    const empty = { ...policy, seguridad: { autenticacion: '', requisitos: [] } }
    const { content } = renderAgentsMd(empty)
    expect(content).not.toContain('## Seguridad')
    expect(content).not.toContain('<Nombre del proyecto>')
  })

  it('AGENTS.md leaves out empty dependency and risk lists', () => {
    const policy = fixturePolicy()
    const { content } = renderAgentsMd({
      ...policy,
      dependencias: { ...policy.dependencias, permitidas: [], prohibidas: [], licencias_permitidas: [] },
      riesgo: { ...policy.riesgo, alto: [], bajo: [] },
    })
    for (const label of ['Permitidas', 'Prohibidas', 'Licencias permitidas', 'Riesgo alto', 'Riesgo bajo']) {
      expect(content).not.toContain(label)
    }
  })

  it('renders a command with backticks using a longer fence', () => {
    const policy = fixturePolicy()
    const stack = { ...policy.stack, comandos: { ...policy.stack.comandos, pruebas: 'echo `date`' } }
    expect(renderAgentsMd({ ...policy, stack }).content).toContain('`` echo `date` ``')
  })

  it('Copilot and Cursor share the same pointer text', () => {
    const copilot = renderCopilot(fixturePolicy()).content.split('\n').slice(2)
    const cursor = renderCursor(fixturePolicy()).content.split('\n').slice(2)
    expect(cursor).toEqual(copilot)
  })

  it('CODEOWNERS assigns .lead/ and .github/workflows/ to the lead and the scrum master', () => {
    const { content } = renderCodeowners(fixturePolicy())
    expect(content).toContain('.lead/ @ana-lead @luis-sm')
    expect(content).toContain('.github/workflows/ @ana-lead @luis-sm')
  })

  it('CODEOWNERS assigns only the lead when there is no scrum master', () => {
    const policy = fixturePolicy()
    const { content } = renderCodeowners({ ...policy, equipo: { ...policy.equipo, scrum_master: '' } })
    expect(content).toBe('.lead/ @ana-lead\n.github/workflows/ @ana-lead')
  })

  it('the exception template asks qué, ticket, porqué, alternativas descartadas and bloquea', () => {
    const form = parse(renderExceptionTemplate().content) as { body: Array<{ attributes: { label: string } }> }
    const labels = form.body.map((field) => field.attributes.label.toLowerCase()).join('|')
    for (const expected of ['qué', 'ticket', 'por qué', 'alternativas descartadas', 'bloquea']) {
      expect(labels).toContain(expected)
    }
  })

  it('CLAUDE.md starts with @AGENTS.md', () => {
    expect(renderClaudeMd(fixturePolicy()).content.startsWith('@AGENTS.md')).toBe(true)
  })
})

describe('generateAll', () => {
  it('creates every file and then reports no changes', async () => {
    const directory = await temporaryDirectory()
    const first = await generateAll(directory, fixturePolicy())
    expect(first).toHaveLength(8)
    expect(first.every((outcome) => outcome.estado === 'creado')).toBe(true)
    expect(await readFile(join(directory, '.github/pull_request_template.md'), 'utf8')).toContain(
      'Agente y modelo usados',
    )
    const second = await generateAll(directory, fixturePolicy())
    expect(second.every((outcome) => outcome.estado === 'sin_cambios')).toBe(true)
  })

  it('writes the Cursor header on line 1', async () => {
    const directory = await temporaryDirectory()
    await generateAll(directory, fixturePolicy())
    const text = await readFile(join(directory, '.cursor/rules/lead-flow.mdc'), 'utf8')
    expect(text.split('\n')[0]).toBe('---')
  })

  it('writes nothing when any output is in conflict', async () => {
    const directory = await temporaryDirectory()
    const handWritten = join(directory, '.github/CODEOWNERS')
    await mkdir(dirname(handWritten), { recursive: true })
    await writeFile(handWritten, '* @alguien\n', 'utf8')
    const outcomes = await generateAll(directory, fixturePolicy())
    expect(outcomes.some((outcome) => outcome.estado === 'conflicto')).toBe(true)
    expect(await readFile(handWritten, 'utf8')).toBe('* @alguien\n')
    const { error } = await attempt(readFile(join(directory, 'AGENTS.md'), 'utf8'))
    expect(error).not.toBeNull()
  })
})

describe('generateAll atomicity', () => {
  const readAll = (directory: string) =>
    Promise.all(
      ['AGENTS.md', 'CLAUDE.md', '.github/CODEOWNERS', '.cursor/rules/lead-flow.mdc'].map(async (file) => {
        const { value } = await attempt(readFile(join(directory, file), 'utf8'))
        return value
      }),
    )

  it('restores every file and throws a named error when a write fails', async () => {
    const directory = await temporaryDirectory()
    const policy = fixturePolicy()
    await generateAll(directory, policy)
    const before = await readAll(directory)
    renameControl.failOn = 'lead-flow.mdc'
    const renamed = { ...policy, proyecto: { ...policy.proyecto, nombre: 'Otro nombre' } }
    const { error } = await attempt(generateAll(directory, renamed))
    renameControl.failOn = ''
    expect(error).toBeInstanceOf(LeadFlowError)
    expect((error as LeadFlowError).code).toBe('ESCRITURA_FALLIDA')
    expect(await readAll(directory)).toEqual(before)
  })

  it('deletes the files it created and leaves no temporary files', async () => {
    const directory = await temporaryDirectory()
    renameControl.failOn = 'lead-flow.mdc'
    const { error } = await attempt(generateAll(directory, fixturePolicy()))
    renameControl.failOn = ''
    expect(error).not.toBeNull()
    expect(await readAll(directory)).toEqual([null, null, null, null])
    const names = await readdir(directory, { recursive: true })
    expect(names.filter((name) => name.endsWith('.lead-flow-tmp'))).toEqual([])
  })
})

describe('generateAll failure handling', () => {
  it('leaves no temporary file when the prepare phase fails', async () => {
    const directory = await temporaryDirectory()
    renameControl.failWriteOn = 'copilot-instructions.md.lead-flow-tmp'
    const { error } = await attempt(generateAll(directory, fixturePolicy()))
    renameControl.failWriteOn = ''
    expect((error as LeadFlowError).code).toBe('ESCRITURA_FALLIDA')
    await new Promise((resolve) => setTimeout(resolve, 100))
    const names = await readdir(directory, { recursive: true })
    expect(names.filter((name) => name.endsWith('.lead-flow-tmp'))).toEqual([])
  })

  it('names the files that could not be restored', async () => {
    const directory = await temporaryDirectory()
    const policy = fixturePolicy()
    await generateAll(directory, policy)
    renameControl.failOn = 'lead-flow.mdc'
    renameControl.failWriteOn = 'CLAUDE.md'
    const renamed = { ...policy, proyecto: { ...policy.proyecto, nombre: 'Otro nombre' } }
    const { error } = await attempt(generateAll(directory, renamed))
    renameControl.failOn = ''
    renameControl.failWriteOn = ''
    expect(error?.message).toContain('No se ha podido restaurar')
    expect(error?.message).toContain('CLAUDE.md')
  })

  it('wraps a read failure in a named error that names the file', async () => {
    const directory = await temporaryDirectory()
    await mkdir(join(directory, 'AGENTS.md'))
    const { error } = await attempt(generateAll(directory, fixturePolicy()))
    expect(error).toBeInstanceOf(LeadFlowError)
    expect((error as LeadFlowError).code).toBe('LECTURA_FALLIDA')
    expect(error?.message).toContain('AGENTS.md')
  })
})

describe('describeOutcomes', () => {
  it('does not say creado for files that were not written when there is a conflict', () => {
    const text = describeOutcomes([
      { path: 'A.md', estado: 'creado', diferencia: '' },
      { path: 'B.md', estado: 'conflicto', diferencia: '- a mano' },
    ])
    expect(text).not.toContain('creado')
    expect(text).toContain('No se ha escrito ningún archivo')
    expect(text).toContain('pendiente: A.md')
    expect(text).toContain('conflicto: B.md')
    expect(text).toContain('- a mano')
  })

  it('does not call unchanged files pendiente when there is a conflict', () => {
    const text = describeOutcomes([
      { path: 'A.md', estado: 'sin_cambios', diferencia: '' },
      { path: 'B.md', estado: 'conflicto', diferencia: '' },
    ])
    expect(text).toContain('sin cambios: A.md')
    expect(text).not.toContain('pendiente')
  })

  it('prints each outcome when there is no conflict', () => {
    const text = describeOutcomes([
      { path: 'A.md', estado: 'creado', diferencia: '' },
      { path: 'B.md', estado: 'sin_cambios', diferencia: '' },
    ])
    expect(text).toBe('creado: A.md\nsin_cambios: B.md')
  })
})

describe('generateReport', () => {
  it('flags the conflict and writes nothing', async () => {
    const directory = await temporaryDirectory()
    await writeFile(join(directory, 'AGENTS.md'), 'a mano\n', 'utf8')
    const report = await generateReport(directory, fixturePolicy())
    expect(report.hasConflict).toBe(true)
    expect(report.text).toContain('conflicto: AGENTS.md')
    expect(await readdir(directory)).toEqual(['AGENTS.md'])
  })
})
