import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { attempt, attemptSync } from '../../src/core/attempt.js'
import { type ToolSpec, runTool } from '../../src/gates/tools.js'
import {
  type CommitRange,
  parseGitleaksReport,
  parseSemgrepReport,
  readCommitRange,
  runGate,
  runTestCommands,
  sastToolSpec,
  secretsToolSpec,
} from '../../src/gates/run-gate.js'
import { type Policy, validatePolicy } from '../../src/policy/schema.js'

const fixturePolicy = (): Policy =>
  validatePolicy(parse(readFileSync(new URL('../fixtures/politica-valida.yml', import.meta.url), 'utf8')))

const withCommands = (comandos: Policy['stack']['comandos']): Policy => {
  const policy = fixturePolicy()
  return { ...policy, stack: { ...policy.stack, comandos } }
}

const parseJsonList = (stdout: string) => {
  const list = JSON.parse(stdout) as unknown[]
  return { ok: list.length === 0, detalles: list }
}

const nodeTool = (script: string, overrides: Partial<ToolSpec> = {}): ToolSpec => ({
  puerta: 'secretos',
  command: process.execPath,
  args: ['-e', script],
  parse: parseJsonList,
  ...overrides,
})

const semgrepTool = (report: unknown) =>
  nodeTool(`process.stdout.write(${JSON.stringify(JSON.stringify(report))})`, { puerta: 'sast', parse: parseSemgrepReport })

const SHA_BASE = 'a'.repeat(40)
const SHA_HEAD = 'b'.repeat(40)

describe('runTool', () => {
  it('reports no_verificado when the tool fails', async () => {
    const evidence = await runTool(nodeTool('', { command: 'herramienta-que-no-existe-lead-flow' }))
    expect(evidence.estado).toBe('no_verificado')
    expect(evidence.resumen).toContain('herramienta-que-no-existe-lead-flow')
    expect(evidence.version).toBe('desconocida')
  })

  it('reports no_verificado when the output does not parse', async () => {
    const evidence = await runTool(nodeTool("process.stdout.write('esto no es json')"))
    expect(evidence.estado).toBe('no_verificado')
  })

  it('reports no_verificado when the tool ends with an unexpected exit code', async () => {
    const evidence = await runTool(nodeTool("process.stdout.write('[]'); process.exit(2)"))
    expect(evidence.estado).toBe('no_verificado')
    expect(evidence.resumen).toContain('2')
  })

  it('accepts the exit codes the spec allows', async () => {
    const script = "process.stdout.write('[{\"regla\":\"x\"}]'); process.exit(1)"
    const evidence = await runTool(nodeTool(script, { acceptedExitCodes: [0, 1] }))
    expect(evidence.estado).toBe('fallo')
    expect(evidence.detalles).toEqual([{ regla: 'x' }])
  })

  it('reports ok and records the tool version', async () => {
    const evidence = await runTool(nodeTool("process.stdout.write('[]')"))
    expect(evidence.estado).toBe('ok')
    expect(evidence.version).toBe(process.version)
    expect(evidence.puerta).toBe('secretos')
    expect(Number.isNaN(Date.parse(evidence.fecha))).toBe(false)
  })
})

describe('gate tools', () => {
  it('calls gitleaks with its own configuration and without the allow comments', () => {
    const spec = secretsToolSpec(null)
    expect(spec.command).toBe('gitleaks')
    expect(spec.args.slice(0, 2)).toEqual(['git', '.'])
    expect(spec.args).toContain('--ignore-gitleaks-allow')
    expect(spec.args).toContain('--redact')
    const config = spec.args[spec.args.indexOf('--config') + 1] as string
    expect(readFileSync(config, 'utf8')).toMatch(/useDefault\s*=\s*true/)
    const ignorePath = spec.args[spec.args.indexOf('--gitleaks-ignore-path') + 1] as string
    expect(existsSync(join(ignorePath, '.gitleaksignore'))).toBe(false)
  })

  it('scans only the commits of the pull request when the range is known', () => {
    const spec = secretsToolSpec({ base: SHA_BASE, head: SHA_HEAD })
    expect(spec.args.slice(-2)).toEqual(['--log-opts', `--text ${SHA_BASE}..${SHA_HEAD}`])
  })

  it('makes git show every file as text so a .gitattributes cannot hide it', () => {
    const logOptions = (range: CommitRange | null) => {
      const args = secretsToolSpec(range).args
      return (args[args.indexOf('--log-opts') + 1] ?? '').split(' ')
    }
    expect(logOptions({ base: SHA_BASE, head: SHA_HEAD })).toContain('--text')
    expect(logOptions(null)).toEqual(expect.arrayContaining(['--text', '--all', '--full-history']))
  })

  it('reads the commit range from the pull request event', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lead-flow-evento-'))
    const eventPath = join(directory, 'event.json')
    const event = { pull_request: { base: { sha: SHA_BASE }, head: { sha: SHA_HEAD } } }
    await writeFile(eventPath, JSON.stringify(event), 'utf8')
    expect(readCommitRange({ GITHUB_EVENT_PATH: eventPath })).toEqual({ base: SHA_BASE, head: SHA_HEAD })
  })

  it('ignores a commit range that is not made of SHAs', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lead-flow-evento-'))
    const eventPath = join(directory, 'event.json')
    const event = { pull_request: { base: { sha: '--all' }, head: { sha: SHA_HEAD } } }
    await writeFile(eventPath, JSON.stringify(event), 'utf8')
    expect(readCommitRange({ GITHUB_EVENT_PATH: eventPath })).toBeNull()
    expect(readCommitRange({})).toBeNull()
  })

  it('calls semgrep with the packs of the stack and without nosemgrep or .semgrepignore', () => {
    const spec = sastToolSpec(fixturePolicy())
    expect(spec.command).toBe('semgrep')
    expect(spec.args[0]).toBe('scan')
    expect(spec.args).toEqual(expect.arrayContaining(['--config', 'p/typescript', '--json', '--disable-nosem']))
    expect(spec.args).toContain('--x-ignore-semgrepignore-files')
    expect(spec.args).toContain('--metrics=off')
  })

  it('asks semgrep to analyse large files instead of skipping them', () => {
    const args = sastToolSpec(fixturePolicy()).args
    expect(args[args.indexOf('--max-target-bytes') + 1]).toBe('0')
  })

  it('falls back to the default semgrep pack for a language without a pack', () => {
    const policy = fixturePolicy()
    const spec = sastToolSpec({ ...policy, stack: { ...policy.stack, lenguajes: ['cobol'] } })
    expect(spec.args).toEqual(expect.arrayContaining(['--config', 'p/default']))
  })

  it('turns a gitleaks report into details without the secret', () => {
    const report = [{ RuleID: 'aws-access-token', File: 'src/a.ts', StartLine: 3, Commit: SHA_HEAD, Secret: 'AKIA…' }]
    const result = parseGitleaksReport(JSON.stringify(report))
    expect(result.ok).toBe(false)
    expect(result.detalles).toEqual([{ regla: 'aws-access-token', archivo: 'src/a.ts', linea: 3, commit: SHA_HEAD }])
    expect(JSON.stringify(result.detalles)).not.toContain('AKIA')
    expect(parseGitleaksReport('[]').ok).toBe(true)
    expect(parseGitleaksReport('null').ok).toBe(true)
    expect(attemptSync(() => parseGitleaksReport('{}')).error).not.toBeNull()
  })

  it('turns a semgrep report into details', () => {
    const report = { results: [{ check_id: 'js.eval', path: 'src/a.ts', start: { line: 9 }, extra: { lines: 'eval(x)' } }], errors: [] }
    const result = parseSemgrepReport(JSON.stringify(report))
    expect(result.ok).toBe(false)
    expect(result.detalles).toEqual([{ regla: 'js.eval', archivo: 'src/a.ts', linea: 9 }])
    expect(parseSemgrepReport(JSON.stringify({ results: [], errors: [] })).ok).toBe(true)
    expect(attemptSync(() => parseSemgrepReport('[]')).error).not.toBeNull()
  })

  it('reports no_verificado when semgrep could not analyse some files', async () => {
    const errors = [
      { level: 'error', type: 'Fatal error', message: 'sin memoria' },
      { level: 'warn', type: 'Timeout', message: 'tiempo agotado', path: 'src/grande.ts' },
    ]
    const evidence = await runTool(semgrepTool({ results: [], errors }))
    expect(evidence.estado).toBe('no_verificado')
    expect(evidence.resumen).toContain('2')
    expect(evidence.detalles).toHaveLength(2)
  })

  it('keeps semgrep warnings in the summary and the details without changing the status', async () => {
    const errors = [{ level: 'warn', type: ['PartialParsing', []], message: 'análisis parcial', path: 'src/a.ts' }]
    const evidence = await runTool(semgrepTool({ results: [], errors }))
    expect(evidence.estado).toBe('ok')
    expect(evidence.resumen).toContain('Avisos de la herramienta: 1')
    expect(evidence.detalles).toEqual([expect.objectContaining({ tipo: 'aviso', archivo: 'src/a.ts' })])
  })
})

describe('pruebas gate', () => {
  it('passes when every command of the policy ends well', async () => {
    const evidence = await runTestCommands(withCommands({ pruebas: 'exit 0', lint: 'exit 0', build: 'exit 0' }))
    expect(evidence.estado).toBe('ok')
    expect(evidence.puerta).toBe('pruebas')
    expect(evidence.detalles).toHaveLength(3)
  })

  it('fails and names the command that failed', async () => {
    const evidence = await runTestCommands(withCommands({ pruebas: 'exit 0', lint: 'exit 3', build: 'exit 0' }))
    expect(evidence.estado).toBe('fallo')
    expect(evidence.resumen).toContain('lint')
    expect(evidence.resumen).not.toContain('build')
  })
})

describe('runGate', () => {
  it('leaves dependencias as no_verificado until its gate exists', async () => {
    const evidence = await runGate('dependencias', { directory: process.cwd(), env: {} })
    expect(evidence.estado).toBe('no_verificado')
    expect(evidence.resumen).toContain('dependencias')
  })

  it('reports no_verificado when the policy cannot be read', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lead-flow-sin-politica-'))
    const evidence = await runGate('sast', { directory, env: {} })
    expect(evidence.estado).toBe('no_verificado')
    expect(evidence.puerta).toBe('sast')
  })

  it('rejects an unknown gate', async () => {
    const { error } = await attempt(runGate('otra', { directory: process.cwd(), env: {} }))
    expect(error?.message).toContain('otra')
  })
})
