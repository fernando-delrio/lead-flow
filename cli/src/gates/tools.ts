import { type ChildProcess, type StdioOptions, spawn } from 'node:child_process'
import { text } from 'node:stream/consumers'
import { attempt, attemptSync } from '../core/attempt.js'
import type { GateEvidence, GateStatus } from '../policy/schema.js'
import { createEvidence } from './evidence.js'

// errors: lo que la herramienta no ha podido analizar, deja la puerta sin verificar.
// warnings: avisos que se cuentan en el resumen y van a detalles sin cambiar el estado.
export type ToolResult = { ok: boolean; detalles: unknown[]; errors?: unknown[]; warnings?: unknown[] }

export type ToolSpec = {
  puerta: string
  command: string
  args: string[]
  parse: (stdout: string) => ToolResult
  versionArgs?: string[]
  acceptedExitCodes?: number[]
}

// capture: la salida estándar es el informe de la herramienta. show: va al registro del job.
export type OutputMode = 'capture' | 'show'

export type Execution = { exitCode: number | null; stdout: string; failure: Error | null }

type Verdict = { estado: GateStatus; resumen: string; detalles: unknown[] }

const STDIO_BY_MODE: Record<OutputMode, StdioOptions> = {
  capture: ['ignore', 'pipe', 'inherit'],
  show: ['ignore', 'inherit', 'inherit'],
}
const DEFAULT_VERSION_ARGS = ['--version']
const DEFAULT_ACCEPTED_EXIT_CODES = [0]
const UNKNOWN_VERSION = 'desconocida'
const NOT_VERIFIED_NOTE = 'La puerta queda sin verificar y cuenta como fallo.'

const waitForExit = (child: ChildProcess) =>
  new Promise<Pick<Execution, 'exitCode' | 'failure'>>((resolve) => {
    child.once('error', (failure) => resolve({ exitCode: null, failure }))
    child.once('close', (exitCode) => resolve({ exitCode, failure: null }))
  })

const readOutput = async (child: ChildProcess) => {
  if (!child.stdout) return ''
  const { value } = await attempt(text(child.stdout))
  return value ?? ''
}

// Sin shell: los argumentos llegan tal cual al programa y nada se interpreta por el camino.
export const executeCommand = async (command: string, args: string[], mode: OutputMode = 'capture'): Promise<Execution> => {
  const started = attemptSync(() => spawn(command, args, { shell: false, stdio: STDIO_BY_MODE[mode], windowsHide: true }))
  if (started.error) return { exitCode: null, stdout: '', failure: started.error }
  const [stdout, exit] = await Promise.all([readOutput(started.value), waitForExit(started.value)])
  return { ...exit, stdout }
}

const firstLine = (output: string) => output.trim().split(/\r?\n/)[0] ?? ''

const readToolVersion = async (spec: ToolSpec) => {
  const run = await executeCommand(spec.command, spec.versionArgs ?? DEFAULT_VERSION_ARGS)
  if (run.failure || run.exitCode !== 0) return UNKNOWN_VERSION
  return firstLine(run.stdout) || UNKNOWN_VERSION
}

const notVerified = (reason: string): Verdict => ({
  estado: 'no_verificado',
  resumen: `${reason} ${NOT_VERIFIED_NOTE}`,
  detalles: [],
})

const describeWarnings = (warnings: unknown[]) => {
  if (warnings.length === 0) return ''
  return ` Avisos de la herramienta: ${warnings.length}.`
}

const describeResult = (command: string, result: ToolResult): Verdict => {
  const errors = result.errors ?? []
  const warnings = result.warnings ?? []
  const detalles = [...result.detalles, ...errors, ...warnings]
  if (errors.length > 0) {
    return { ...notVerified(`«${command}» no ha podido analizar todo el código (errores: ${errors.length}).`), detalles }
  }
  const note = describeWarnings(warnings)
  if (result.ok) return { estado: 'ok', resumen: `«${command}» no ha encontrado hallazgos.${note}`, detalles }
  return { estado: 'fallo', resumen: `«${command}» ha encontrado hallazgos: ${result.detalles.length}.${note}`, detalles }
}

const judgeExecution = (spec: ToolSpec, run: Execution): Verdict => {
  if (run.failure) return notVerified(`No se ha podido ejecutar «${spec.command}»: ${run.failure.message}.`)
  const accepted = spec.acceptedExitCodes ?? DEFAULT_ACCEPTED_EXIT_CODES
  if (run.exitCode === null || !accepted.includes(run.exitCode)) {
    return notVerified(`«${spec.command}» ha terminado de forma inesperada (código ${String(run.exitCode)}).`)
  }
  const parsed = attemptSync(() => spec.parse(run.stdout))
  if (parsed.error) return notVerified(`La salida de «${spec.command}» no se puede leer: ${parsed.error.message}.`)
  return describeResult(spec.command, parsed.value)
}

export const runTool = async (spec: ToolSpec): Promise<GateEvidence> => {
  const run = await executeCommand(spec.command, spec.args)
  const version = await readToolVersion(spec)
  const verdict = judgeExecution(spec, run)
  return createEvidence({ puerta: spec.puerta, herramienta: spec.command, version, ...verdict })
}
