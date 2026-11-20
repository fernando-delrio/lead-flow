import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { attempt, attemptSync } from '../core/attempt.js'
import { PRODUCT_NAME } from '../core/constants.js'
import { LeadFlowError } from '../core/errors.js'
import { CLI_VERSION } from '../core/version.js'
import type { GateEvidence, GateStatus, Policy } from '../policy/schema.js'
import { loadPolicy } from '../policy/store.js'
import { createEvidence } from './evidence.js'
import { type Execution, type ToolResult, type ToolSpec, executeCommand, runTool } from './tools.js'

type Environment = Record<string, string | undefined>
type JsonRecord = Record<string, unknown>
type Shell = { command: string; flags: string[] }
type CommandName = keyof Policy['stack']['comandos']
type CommandOutcome = { comando: CommandName; orden: string; codigo: number | null; estado: GateStatus }

export type GateContext = { directory: string; env: Environment }
export type CommitRange = { base: string; head: string }

// Desde src/ y desde dist/ la carpeta config/ del paquete queda a la misma distancia.
const CONFIG_DIRECTORY_URL = new URL('../../config/', import.meta.url)
const GITLEAKS_CONFIG = fileURLToPath(new URL('gitleaks.toml', CONFIG_DIRECTORY_URL))
// Carpeta sin .gitleaksignore: así gitleaks no toma el de la carpeta de trabajo. El de la raíz del
// repositorio lo lee siempre (8.30 no tiene opción para evitarlo); por eso integridad lo protege.
const GITLEAKS_IGNORE_DIRECTORY = fileURLToPath(CONFIG_DIRECTORY_URL)
const SHA_PATTERN = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/
const UNKNOWN_GATE_CODE = 'PUERTA_DESCONOCIDA'
const INVALID_REPORT_CODE = 'INFORME_ILEGIBLE'
const NOT_APPLICABLE = 'no aplica'
const TESTS_TOOL = 'comandos de stack.comandos'
const NOT_VERIFIED_NOTE = 'La puerta queda sin verificar y cuenta como fallo.'

const SEMGREP_DEFAULT_PACK = 'p/default'
const SEMGREP_PACKS: Record<string, string> = {
  python: 'p/python',
  javascript: 'p/javascript',
  typescript: 'p/typescript',
  java: 'p/java',
  php: 'p/php',
  'c#': 'p/csharp',
  csharp: 'p/csharp',
  go: 'p/golang',
  ruby: 'p/ruby',
}

const COMMAND_ORDER: CommandName[] = ['pruebas', 'lint', 'build']
const POSIX_SHELL: Shell = { command: '/bin/sh', flags: ['-c'] }
const SHELLS: Record<string, Shell> = { win32: { command: 'cmd.exe', flags: ['/d', '/s', '/c'] } }
// 126 y 127 (sh) y 9009 (cmd) dicen que el comando no se pudo lanzar, no que las pruebas fallen.
const SHELL_EXIT_STATUS: Record<number, GateStatus> = { 0: 'ok', 126: 'no_verificado', 127: 'no_verificado', 9009: 'no_verificado' }
const STATUS_RANK: Record<GateStatus, number> = { ok: 0, no_verificado: 1, fallo: 2 }

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readKey = (current: unknown, key: string): unknown => {
  if (!isRecord(current)) return undefined
  return current[key]
}

const pickPath = (value: unknown, keys: string[]): unknown => keys.reduce(readKey, value)

const invalidReport = (tool: string, what: string): never => {
  throw new LeadFlowError(INVALID_REPORT_CODE, `el informe de ${tool} ${what}`)
}

const rangeArgs = (range: CommitRange | null) => {
  if (range === null) return []
  return ['--log-opts', `${range.base}..${range.head}`]
}

// Configuración explícita: un .gitleaks.toml o un «gitleaks:allow» de la pull request no apagan la puerta.
export const secretsToolSpec = (range: CommitRange | null): ToolSpec => ({
  puerta: 'secretos',
  command: 'gitleaks',
  args: [
    'git', '.',
    '--config', GITLEAKS_CONFIG,
    '--gitleaks-ignore-path', GITLEAKS_IGNORE_DIRECTORY,
    '--ignore-gitleaks-allow',
    '--redact', '--no-banner',
    '--exit-code', '0',
    '--report-format', 'json', '--report-path', '-',
    ...rangeArgs(range),
  ],
  versionArgs: ['version'],
  parse: parseGitleaksReport,
})

const toSecretFinding = (item: unknown) => {
  if (!isRecord(item)) return invalidReport('gitleaks', 'tiene un hallazgo que no es un objeto')
  return { regla: item.RuleID, archivo: item.File, linea: item.StartLine, commit: item.Commit }
}

// El secreto no se copia a la evidencia: solo la regla, el archivo, la línea y el commit.
export const parseGitleaksReport = (stdout: string): ToolResult => {
  const report = JSON.parse(stdout) as unknown
  // gitleaks escribe null cuando no encuentra nada (lista vacía de Go).
  if (report === null) return { ok: true, detalles: [] }
  if (!Array.isArray(report)) return invalidReport('gitleaks', 'no es una lista')
  const detalles = report.map(toSecretFinding)
  return { ok: detalles.length === 0, detalles }
}

const packFor = (language: string) => {
  const key = language.toLowerCase()
  if (!Object.hasOwn(SEMGREP_PACKS, key)) return []
  return [SEMGREP_PACKS[key] as string]
}

const semgrepPacks = (policy: Policy) => {
  const packs = [...new Set(policy.stack.lenguajes.flatMap(packFor))]
  if (packs.length === 0) return [SEMGREP_DEFAULT_PACK]
  return packs
}

// --x-ignore-semgrepignore-files es interna en semgrep: si desaparece, semgrep falla y la puerta
// queda sin verificar, nunca en verde.
export const sastToolSpec = (policy: Policy): ToolSpec => ({
  puerta: 'sast',
  command: 'semgrep',
  args: [
    'scan',
    ...semgrepPacks(policy).flatMap((pack) => ['--config', pack]),
    '--json', '--disable-nosem', '--x-ignore-semgrepignore-files', '--metrics=off',
    '.',
  ],
  parse: parseSemgrepReport,
})

const toCodeFinding = (item: unknown) => {
  if (!isRecord(item)) return invalidReport('semgrep', 'tiene un resultado que no es un objeto')
  return { regla: item.check_id, archivo: item.path, linea: pickPath(item, ['start', 'line']) }
}

export const parseSemgrepReport = (stdout: string): ToolResult => {
  const report = JSON.parse(stdout) as unknown
  if (!isRecord(report) || !Array.isArray(report.results)) return invalidReport('semgrep', 'no trae «results»')
  const detalles = report.results.map(toCodeFinding)
  return { ok: detalles.length === 0, detalles }
}


const readEventSha = (event: unknown, side: string) => {
  const sha = pickPath(event, ['pull_request', side, 'sha'])
  if (typeof sha === 'string' && SHA_PATTERN.test(sha)) return sha
  return null
}

// GitHub deja el evento de la pull request en GITHUB_EVENT_PATH: de ahí salen base y cabeza.
export const readCommitRange = (env: Environment): CommitRange | null => {
  const eventPath = env.GITHUB_EVENT_PATH ?? ''
  if (eventPath === '') return null
  const { value: event } = attemptSync(() => JSON.parse(readFileSync(eventPath, 'utf8')) as unknown)
  const base = readEventSha(event, 'base')
  const head = readEventSha(event, 'head')
  if (base === null || head === null) return null
  return { base, head }
}

const platformShell = () => SHELLS[process.platform] ?? POSIX_SHELL

const toCommandStatus = (run: Execution): GateStatus => {
  if (run.failure || run.exitCode === null) return 'no_verificado'
  return SHELL_EXIT_STATUS[run.exitCode] ?? 'fallo'
}

// Los comandos van por el shell porque los escribió la lead en .lead/politica.yml, que es un
// archivo protegido. Nunca se ejecuta nada que venga del título, el texto o los comentarios de la pull request.
const runPolicyCommand = async (comando: CommandName, orden: string): Promise<CommandOutcome> => {
  const shell = platformShell()
  console.log(`lead-flow: ${comando} → ${orden}`)
  const run = await executeCommand(shell.command, [...shell.flags, orden], 'show')
  return { comando, orden, codigo: run.exitCode, estado: toCommandStatus(run) }
}

const runInOrder = (policy: Policy) =>
  COMMAND_ORDER.reduce<Promise<CommandOutcome[]>>(
    async (previous, name) => [...(await previous), await runPolicyCommand(name, policy.stack.comandos[name])],
    Promise.resolve([])
  )

const pickWorse = (current: GateStatus, candidate: GateStatus) => {
  if (STATUS_RANK[candidate] > STATUS_RANK[current]) return candidate
  return current
}

const worstStatus = (outcomes: CommandOutcome[]) =>
  outcomes.map((outcome) => outcome.estado).reduce(pickWorse, 'ok')

const describeOutcome = ({ comando, codigo, estado }: CommandOutcome) => {
  if (estado === 'no_verificado') return `${comando} (no se ha podido ejecutar, código ${String(codigo)})`
  return `${comando} (código ${String(codigo)})`
}

const SUMMARIES: Record<GateStatus, (pending: string) => string> = {
  ok: () => 'Los comandos de la política han terminado con código 0: pruebas, lint y build.',
  fallo: (pending) => `Han fallado comandos de la política: ${pending}.`,
  no_verificado: (pending) => `No se han podido ejecutar comandos de la política: ${pending}. ${NOT_VERIFIED_NOTE}`,
}

export const runTestCommands = async (policy: Policy): Promise<GateEvidence> => {
  const outcomes = await runInOrder(policy)
  const estado = worstStatus(outcomes)
  const pending = outcomes.filter((outcome) => outcome.estado !== 'ok').map(describeOutcome).join(', ')
  const resumen = SUMMARIES[estado](pending)
  return createEvidence({ puerta: 'pruebas', estado, resumen, herramienta: TESTS_TOOL, version: NOT_APPLICABLE, detalles: outcomes })
}

const pendingDependencies = async () =>
  createEvidence({
    puerta: 'dependencias',
    estado: 'no_verificado',
    resumen: `La puerta de dependencias todavía no está disponible en esta versión de ${PRODUCT_NAME}. ${NOT_VERIFIED_NOTE}`,
    herramienta: PRODUCT_NAME,
    version: CLI_VERSION,
    detalles: [],
  })

const GATES: Record<string, (context: GateContext) => Promise<GateEvidence>> = {
  secretos: async (context) => runTool(secretsToolSpec(readCommitRange(context.env))),
  sast: async (context) => runTool(sastToolSpec(await loadPolicy(context.directory))),
  pruebas: async (context) => runTestCommands(await loadPolicy(context.directory)),
  dependencias: pendingDependencies,
}

const notVerifiedGate = (puerta: string, error: Error) =>
  createEvidence({
    puerta,
    estado: 'no_verificado',
    resumen: `No se ha podido ejecutar la puerta: ${error.message} ${NOT_VERIFIED_NOTE}`,
    herramienta: PRODUCT_NAME,
    version: CLI_VERSION,
    detalles: [],
  })

export const runGate = async (name: string, context: GateContext): Promise<GateEvidence> => {
  const gate = GATES[name]
  if (!Object.hasOwn(GATES, name) || gate === undefined) {
    throw new LeadFlowError(UNKNOWN_GATE_CODE, `La puerta «${name}» no existe. Puertas: ${Object.keys(GATES).join(', ')}.`)
  }
  const { value, error } = await attempt(gate(context))
  if (!error) return value
  return notVerifiedGate(name, error)
}
