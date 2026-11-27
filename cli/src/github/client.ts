import { attempt } from '../core/attempt.js'
import { LeadFlowError } from '../core/errors.js'
import { PRODUCT_NAME } from '../core/constants.js'
import type { Review } from '../policy/schema.js'

// El único archivo que habla con la API de GitHub (Ruling 4). Cada tarea añade aquí sus métodos.

export type PullRequest = { number: number; headSha: string; baseSha: string; author: string; changedFiles: number }
export type ChangedFile = { path: string; previousPath: string | null }
export type CommitReview = Review & { commitSha: string }
export type CommitStatus = { state: 'success' | 'failure'; context: string; description: string; target_url?: string }

export type GitHubClient = {
  getPullRequest: (number: number) => Promise<PullRequest>
  findPullRequestNumber: (headSha: string) => Promise<number>
  listChangedFiles: (number: number) => Promise<ChangedFile[]>
  listReviews: (number: number) => Promise<CommitReview[]>
  getFile: (path: string, ref: string) => Promise<string | null>
  setCommitStatus: (sha: string, status: CommitStatus) => Promise<void>
}

type Environment = Record<string, string | undefined>
type Connection = { apiUrl: string; repository: string; token: string; fetcher: typeof fetch }
type RequestSpec = { path: string; method?: string; body?: unknown; accept?: string }
type JsonRecord = Record<string, unknown>

const DEFAULT_API_URL = 'https://api.github.com'
const API_VERSION = '2022-11-28'
const JSON_MEDIA_TYPE = 'application/vnd.github+json'
const RAW_MEDIA_TYPE = 'application/vnd.github.raw+json'
const BODY_MEDIA_TYPE = 'application/json'
const DEFAULT_METHOD = 'GET'
const NOT_FOUND_STATUS = 404
const PAGE_SIZE = 100
// La API de archivos de una pull request no devuelve más de 3000 (30 páginas de 100).
const MAX_PAGES = 30
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const SHA_PATTERN = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/
const TRAILING_SLASH = /\/+$/
const REVIEW_STATES: Array<Review['estado']> = ['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED']
const OPEN_STATE = 'open'

const MISSING_TOKEN_CODE = 'GITHUB_SIN_TOKEN'
const INVALID_REPOSITORY_CODE = 'GITHUB_REPOSITORIO_INVALIDO'
const INVALID_ARGUMENT_CODE = 'GITHUB_ARGUMENTO_INVALIDO'
const NO_RESPONSE_CODE = 'GITHUB_SIN_RESPUESTA'
const API_ERROR_CODE = 'GITHUB_ERROR'
const UNEXPECTED_RESPONSE_CODE = 'GITHUB_RESPUESTA_INESPERADA'
const PULL_REQUEST_NOT_FOUND_CODE = 'PULL_REQUEST_NO_ENCONTRADA'

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const unexpected = (what: string): never => {
  throw new LeadFlowError(UNEXPECTED_RESPONSE_CODE, `GitHub ha devuelto una respuesta inesperada: ${what}.`)
}

const readRecord = (value: unknown, what: string): JsonRecord => {
  if (isRecord(value)) return value
  return unexpected(`falta ${what}`)
}

const readList = (value: unknown, what: string): unknown[] => {
  if (Array.isArray(value)) return value
  return unexpected(`${what} no es una lista`)
}

const readText = (record: JsonRecord, key: string): string => {
  const value = record[key]
  if (typeof value === 'string') return value
  return unexpected(`falta «${key}»`)
}

const readNumber = (record: JsonRecord, key: string): number => {
  const value = record[key]
  if (typeof value === 'number') return value
  return unexpected(`falta «${key}»`)
}

const nestedText = (record: JsonRecord, outer: string, inner: string) =>
  readText(readRecord(record[outer], `«${outer}»`), inner)

const requireSha = (sha: string) => {
  if (SHA_PATTERN.test(sha)) return sha
  throw new LeadFlowError(INVALID_ARGUMENT_CODE, `«${sha}» no es el SHA de un commit.`)
}

const requirePullNumber = (number: number) => {
  if (Number.isInteger(number) && number > 0) return number
  throw new LeadFlowError(INVALID_ARGUMENT_CODE, `«${number}» no es el número de una pull request.`)
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/')

const describeRequest = (spec: RequestSpec) => `${spec.method ?? DEFAULT_METHOD} ${spec.path.split('?')[0]}`

const buildInit = (connection: Connection, spec: RequestSpec): RequestInit => ({
  method: spec.method ?? DEFAULT_METHOD,
  headers: {
    accept: spec.accept ?? JSON_MEDIA_TYPE,
    authorization: `Bearer ${connection.token}`,
    'user-agent': PRODUCT_NAME,
    'x-github-api-version': API_VERSION,
    'content-type': BODY_MEDIA_TYPE,
  },
  body: JSON.stringify(spec.body),
})

const sendRequest = async (connection: Connection, spec: RequestSpec): Promise<Response> => {
  const url = `${connection.apiUrl}/repos/${connection.repository}${spec.path}`
  const { value, error } = await attempt(connection.fetcher(url, buildInit(connection, spec)))
  if (!error) return value
  throw new LeadFlowError(NO_RESPONSE_CODE, `GitHub no responde a ${describeRequest(spec)}: ${error.message}`)
}

const expectOk = (response: Response, spec: RequestSpec) => {
  if (response.ok) return response
  throw new LeadFlowError(API_ERROR_CODE, `GitHub ha respondido ${response.status} a ${describeRequest(spec)}.`)
}

const requestJson = async (connection: Connection, spec: RequestSpec): Promise<unknown> => {
  const response = expectOk(await sendRequest(connection, spec), spec)
  const { value, error } = await attempt(response.json() as Promise<unknown>)
  if (!error) return value
  return unexpected(`la respuesta a ${describeRequest(spec)} no es JSON`)
}

const requestPages = async (connection: Connection, path: string, page = 1): Promise<unknown[]> => {
  const items = readList(await requestJson(connection, { path: `${path}?per_page=${PAGE_SIZE}&page=${page}` }), path)
  if (items.length < PAGE_SIZE || page >= MAX_PAGES) return items
  return [...items, ...(await requestPages(connection, path, page + 1))]
}

const toPullRequest = (value: unknown): PullRequest => {
  const record = readRecord(value, 'la pull request')
  return {
    number: readNumber(record, 'number'),
    headSha: nestedText(record, 'head', 'sha'),
    baseSha: nestedText(record, 'base', 'sha'),
    author: nestedText(record, 'user', 'login'),
    changedFiles: readNumber(record, 'changed_files'),
  }
}

const readOptionalText = (record: JsonRecord, key: string): string | null => {
  const value = record[key]
  if (typeof value === 'string') return value
  return null
}

const toChangedFile = (value: unknown): ChangedFile => {
  const record = readRecord(value, 'un archivo')
  return { path: readText(record, 'filename'), previousPath: readOptionalText(record, 'previous_filename') }
}

// Una reseña descartada (DISMISSED) o pendiente no cuenta: se deja fuera.
const toReviews = (value: unknown): CommitReview[] => {
  const record = readRecord(value, 'una reseña')
  const estado = record.state as Review['estado']
  if (!REVIEW_STATES.includes(estado)) return []
  return [
    {
      usuario: nestedText(record, 'user', 'login'),
      estado,
      fecha: readText(record, 'submitted_at'),
      commitSha: readText(record, 'commit_id'),
    },
  ]
}

const isOpenPullRequestWithHead = (value: unknown, headSha: string) => {
  const record = readRecord(value, 'una pull request')
  return record.state === OPEN_STATE && nestedText(record, 'head', 'sha') === headSha
}

const pickSinglePullRequest = (pulls: unknown[], headSha: string) => {
  const matching = pulls.filter((pull) => isOpenPullRequestWithHead(pull, headSha))
  if (matching.length === 1) return readNumber(readRecord(matching[0], 'la pull request'), 'number')
  throw new LeadFlowError(
    PULL_REQUEST_NOT_FOUND_CODE,
    `Hay ${matching.length} pull requests abiertas con la cabeza ${headSha}; se esperaba exactamente una.`
  )
}

const getFile = async (connection: Connection, path: string, ref: string) => {
  const spec = { path: `/contents/${encodePath(path)}?ref=${requireSha(ref)}`, accept: RAW_MEDIA_TYPE }
  const response = await sendRequest(connection, spec)
  if (response.status === NOT_FOUND_STATUS) return null
  return expectOk(response, spec).text()
}

const setCommitStatus = async (connection: Connection, sha: string, status: CommitStatus) => {
  await requestJson(connection, { path: `/statuses/${requireSha(sha)}`, method: 'POST', body: status })
}

const buildClient = (connection: Connection): GitHubClient => ({
  getPullRequest: async (number) =>
    toPullRequest(await requestJson(connection, { path: `/pulls/${requirePullNumber(number)}` })),
  findPullRequestNumber: async (headSha) => {
    const pulls = readList(await requestJson(connection, { path: `/commits/${requireSha(headSha)}/pulls` }), 'pulls')
    return pickSinglePullRequest(pulls, headSha)
  },
  listChangedFiles: async (number) =>
    (await requestPages(connection, `/pulls/${requirePullNumber(number)}/files`)).map(toChangedFile),
  listReviews: async (number) =>
    (await requestPages(connection, `/pulls/${requirePullNumber(number)}/reviews`)).flatMap(toReviews),
  getFile: (path, ref) => getFile(connection, path, ref),
  setCommitStatus: (sha, status) => setCommitStatus(connection, sha, status),
})

const readConnection = (env: Environment, fetcher: typeof fetch): Connection => {
  const token = env.GITHUB_TOKEN ?? ''
  const repository = env.GITHUB_REPOSITORY ?? ''
  if (token === '') throw new LeadFlowError(MISSING_TOKEN_CODE, 'Falta GITHUB_TOKEN: sin token no se puede consultar GitHub.')
  if (!REPOSITORY_PATTERN.test(repository)) {
    throw new LeadFlowError(INVALID_REPOSITORY_CODE, `GITHUB_REPOSITORY debe ser «propietario/repositorio», pero es «${repository}».`)
  }
  const apiUrl = (env.GITHUB_API_URL || DEFAULT_API_URL).replace(TRAILING_SLASH, '')
  return { apiUrl, repository, token, fetcher }
}

export const createGitHubClient = (env: Environment, fetcher: typeof fetch = fetch): GitHubClient =>
  buildClient(readConnection(env, fetcher))
