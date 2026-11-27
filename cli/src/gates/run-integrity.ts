import { attempt, type Outcome } from '../core/attempt.js'
import { POLICY_PATH, PRODUCT_NAME } from '../core/constants.js'
import { LeadFlowError } from '../core/errors.js'
import { CLI_VERSION } from '../core/version.js'
import { renderAll } from '../generate/all.js'
import type { RenderedFile } from '../generate/outputs/types.js'
import type { ChangedFile, CommitStatus, GitHubClient, PullRequest } from '../github/client.js'
import type { GateEvidence, GateStatus } from '../policy/schema.js'
import { parsePolicy } from '../policy/store.js'
import { createEvidence, writeEvidence } from './evidence.js'
import { INTEGRITY_GATE, type IntegrityInput, checkIntegrity } from './integrity.js'

type Environment = Record<string, string | undefined>
export type IntegrityContext = { env: Environment; client: GitHubClient; evidenceDirectory: string }

// Lo mira la Tarea 17: el ruleset exige este estado en la cabeza de la pull request (Ruling 35).
const STATUS_CONTEXT = 'lead-flow/integridad'
const MAX_DESCRIPTION_LENGTH = 140
const ELLIPSIS = '…'
const PULL_NUMBER_PATTERN = /^[1-9]\d*$/
const WORKFLOW_RUN_EVENT = 'workflow_run'
const UNLOCATED_CODE = 'PULL_REQUEST_SIN_LOCALIZAR'
const MISSING_POLICY_CODE = 'POLITICA_NO_ENCONTRADA'
const INCOMPLETE_LIST_CODE = 'LISTA_INCOMPLETA'
const CHANGED_DURING_CHECK_CODE = 'PULL_REQUEST_CAMBIADA'
const RUN_ID_PATTERN = /^\d+$/
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const SERVER_URL_PATTERN = /^https:\/\/[^\s/]+$/
const NOT_VERIFIED_NOTE = 'La integridad queda sin verificar y cuenta como fallo.'
const COMMIT_STATES: Record<GateStatus, CommitStatus['state']> = { ok: 'success', fallo: 'failure', no_verificado: 'failure' }

// pull_request_target trae el número; workflow_run solo trae el SHA y la pull request se busca por la API.
const locatePullRequestNumber = async ({ env, client }: IntegrityContext) => {
  const number = env.LEAD_FLOW_PR ?? ''
  if (PULL_NUMBER_PATTERN.test(number)) return Number(number)
  const headSha = env.LEAD_FLOW_HEAD_SHA ?? ''
  if (env.LEAD_FLOW_EVENTO === WORKFLOW_RUN_EVENT && headSha !== '') return client.findPullRequestNumber(headSha)
  throw new LeadFlowError(
    UNLOCATED_CODE,
    `No se sabe qué pull request revisar (evento «${env.LEAD_FLOW_EVENTO ?? ''}», LEAD_FLOW_PR «${number}»).`
  )
}

const locatePullRequest = async (context: IntegrityContext) =>
  context.client.getPullRequest(await locatePullRequestNumber(context))

const loadBasePolicy = async (client: GitHubClient, baseSha: string) => {
  const text = await client.getFile(POLICY_PATH, baseSha)
  if (text !== null) return parsePolicy(text)
  throw new LeadFlowError(MISSING_POLICY_CODE, `La rama base no tiene ${POLICY_PATH}: sin política no se puede comprobar el flujo.`)
}

const readFilesOnHead = async (client: GitHubClient, files: RenderedFile[], headSha: string) => {
  const contents = await Promise.all(files.map(async (file) => [file.path, await client.getFile(file.path, headSha)] as const))
  return Object.fromEntries(contents.filter((entry): entry is readonly [string, string] => entry[1] !== null))
}

// Un renombrado cuenta por los dos nombres: sacar un workflow de su carpeta también cambia el flujo.
const flattenPaths = (files: ChangedFile[]) =>
  files.flatMap((file) => [file.path, file.previousPath].filter((path): path is string => path !== null))

const listChangedPaths = async (client: GitHubClient, pullRequest: PullRequest) => {
  const changed = await client.listChangedFiles(pullRequest.number)
  if (changed.length >= pullRequest.changedFiles) return flattenPaths(changed)
  throw new LeadFlowError(
    INCOMPLETE_LIST_CODE,
    `GitHub solo lista ${changed.length} de los ${pullRequest.changedFiles} archivos de la pull request: el resto no se puede comprobar.`
  )
}

// Una aprobación dada a un commit anterior no cubre lo que se subió después.
const listHeadApprovals = async (client: GitHubClient, pullRequest: PullRequest) =>
  (await client.listReviews(pullRequest.number)).filter((review) => review.commitSha === pullRequest.headSha)

const gatherInput = async (client: GitHubClient, pullRequest: PullRequest): Promise<IntegrityInput> => {
  const policy = await loadBasePolicy(client, pullRequest.baseSha)
  const generatedOnBase = renderAll(policy)
  const [changedFiles, approvals, filesOnHead] = await Promise.all([
    listChangedPaths(client, pullRequest),
    listHeadApprovals(client, pullRequest),
    readFilesOnHead(client, generatedOnBase, pullRequest.headSha),
  ])
  return { policy, changedFiles, generatedOnBase, filesOnHead, approvals, author: pullRequest.author }
}

// La lista de archivos no va atada a un SHA: si la cabeza o la base cambian mientras se leen los
// datos, la evidencia sería de un estado que no existe.
const confirmUnchanged = async (client: GitHubClient, first: PullRequest) => {
  const again = await client.getPullRequest(first.number)
  if (again.headSha === first.headSha && again.baseSha === first.baseSha) return
  throw new LeadFlowError(
    CHANGED_DURING_CHECK_CODE,
    `La pull request ha cambiado durante la comprobación (cabeza ${first.headSha} → ${again.headSha}). Se comprobará de nuevo con el nuevo commit.`
  )
}

const checkPullRequest = async (client: GitHubClient, pullRequest: PullRequest) => {
  const input = await gatherInput(client, pullRequest)
  await confirmUnchanged(client, pullRequest)
  return checkIntegrity(input)
}

const notVerified = (error: Error) =>
  createEvidence({
    puerta: INTEGRITY_GATE,
    estado: 'no_verificado',
    resumen: `${error.message} ${NOT_VERIFIED_NOTE}`,
    herramienta: PRODUCT_NAME,
    version: CLI_VERSION,
    detalles: [],
  })

const evidenceFrom = (outcome: Outcome<GateEvidence>) => {
  if (outcome.error) return notVerified(outcome.error)
  return outcome.value
}

// Por caracteres y no por unidades UTF-16: así no se parte un emoji de un nombre de archivo.
const shorten = (text: string) => {
  const characters = Array.from(text)
  if (characters.length <= MAX_DESCRIPTION_LENGTH) return text
  return `${characters.slice(0, MAX_DESCRIPTION_LENGTH - Array.from(ELLIPSIS).length).join('')}${ELLIPSIS}`
}

// El enlace a la ejecución lleva a quien ve el estado hasta el porqué; sin datos válidos no se pone.
const linkToRun = (env: Environment): Pick<CommitStatus, 'target_url'> => {
  const server = env.GITHUB_SERVER_URL ?? ''
  const repository = env.GITHUB_REPOSITORY ?? ''
  const runId = env.GITHUB_RUN_ID ?? ''
  const isValid = SERVER_URL_PATTERN.test(server) && REPOSITORY_PATTERN.test(repository) && RUN_ID_PATTERN.test(runId)
  if (!isValid) return {}
  return { target_url: `${server}/${repository}/actions/runs/${runId}` }
}

const toCommitStatus = (evidence: GateEvidence, env: Environment): CommitStatus => ({
  state: COMMIT_STATES[evidence.estado],
  context: STATUS_CONTEXT,
  description: shorten(evidence.resumen),
  ...linkToRun(env),
})

const recordEvidence = async (context: IntegrityContext, evidence: GateEvidence) => {
  await writeEvidence(context.evidenceDirectory, evidence)
  return evidence
}

export const runIntegrity = async (context: IntegrityContext): Promise<GateEvidence> => {
  const located = await attempt(locatePullRequest(context))
  if (located.error) return recordEvidence(context, notVerified(located.error))
  const pullRequest = located.value
  const checked = await attempt(checkPullRequest(context.client, pullRequest))
  const evidence = await recordEvidence(context, evidenceFrom(checked))
  await context.client.setCommitStatus(pullRequest.headSha, toCommitStatus(evidence, context.env))
  return evidence
}
