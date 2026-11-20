#!/usr/bin/env node
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { attempt } from './core/attempt.js'
import { EVIDENCE_DIR, PRODUCT_NAME } from './core/constants.js'
import { generateReport } from './generate/all.js'
import { writeEvidence } from './gates/evidence.js'
import { runGate } from './gates/run-gate.js'
import { runIntegrity } from './gates/run-integrity.js'
import { createGitHubClient } from './github/client.js'
import type { GateEvidence } from './policy/schema.js'
import { loadPolicy } from './policy/store.js'
import type { Policy } from './policy/schema.js'
import { createTerminalPrompter } from './interview/prompter.js'
import { changeTopic, runInterview } from './interview/run.js'

type Command = (args: string[]) => Promise<void>

const CATALOG_PATH = '../../catalogo'
const ISO_DATE_LENGTH = 10
const FAILURE_EXIT_CODE = 1

const catalogRoot = () => fileURLToPath(new URL(CATALOG_PATH, import.meta.url))

const today = () => new Date().toISOString().slice(0, ISO_DATE_LENGTH)

const generateFiles = async (policy: Policy) => {
  const report = await generateReport(process.cwd(), policy)
  console.log(report.text)
  if (report.hasConflict) process.exitCode = FAILURE_EXIT_CODE
}

const runInit: Command = async () => {
  const policy = await runInterview({
    directory: process.cwd(),
    catalogRoot: catalogRoot(),
    prompter: createTerminalPrompter(),
    today: today(),
  })
  console.log('Política guardada en .lead/politica.yml y decisiones en .lead/decisiones/.')
  await generateFiles(policy)
}

const runChange: Command = async (args) => {
  const tema = args[0] ?? ''
  const policy = await changeTopic(
    {
      directory: process.cwd(),
      catalogRoot: catalogRoot(),
      prompter: createTerminalPrompter(),
      today: today(),
    },
    tema
  )
  console.log(`Tema «${tema}» actualizado y decisión registrada en .lead/decisiones/.`)
  await generateFiles(policy)
}

const runGenerate: Command = async () => {
  await generateFiles(await loadPolicy(process.cwd()))
}

const reportEvidence = (evidence: GateEvidence) => {
  console.log(`${evidence.puerta}: ${evidence.estado}. ${evidence.resumen}`)
  if (evidence.estado !== 'ok') process.exitCode = FAILURE_EXIT_CODE
}

const evidenceDirectory = () => join(process.cwd(), EVIDENCE_DIR)

const runGateCommand: Command = async (args) => {
  const evidence = await runGate(args[0] ?? '', { directory: process.cwd(), env: process.env })
  await writeEvidence(evidenceDirectory(), evidence)
  reportEvidence(evidence)
}

const runIntegrityCommand: Command = async () => {
  const client = createGitHubClient(process.env)
  reportEvidence(await runIntegrity({ env: process.env, client, evidenceDirectory: evidenceDirectory() }))
}

const notAvailable =
  (name: string): Command =>
  async () => {
    console.log(`«${name}» todavía no disponible.`)
  }

const COMMANDS: Record<string, Command> = {
  init: runInit,
  cambiar: runChange,
  generar: runGenerate,
  proteger: notAvailable('proteger'),
  puerta: runGateCommand,
  integridad: runIntegrityCommand,
}

const showHelp: Command = async () => {
  console.log(
    [
      `Uso: ${PRODUCT_NAME} <comando>`,
      '',
      'Comandos:',
      '  init      entrevista para crear la política del equipo',
      '  cambiar   cambiar una decisión de la política',
      '  generar   generar los archivos del repositorio',
      '  proteger  proteger las ramas en GitHub',
      '  puerta    ejecutar una puerta (pruebas, secretos, sast, dependencias)',
      '  integridad  comprobar que la pull request no cambia el flujo sin la lead',
    ].join('\n')
  )
}

const findCommand = (name: string | undefined): Command => {
  if (name === undefined || !Object.hasOwn(COMMANDS, name)) return showHelp
  return COMMANDS[name] ?? showHelp
}

const main = async (args: string[]) => {
  const { error } = await attempt(findCommand(args[0])(args.slice(1)))
  if (!error) return
  console.error(error.message)
  process.exitCode = FAILURE_EXIT_CODE
}

await main(process.argv.slice(2))
