import { describe, expect, it } from 'vitest'
import { attempt, attemptSync } from '../../src/core/attempt.js'
import { LeadFlowError } from '../../src/core/errors.js'
import { createGitHubClient } from '../../src/github/client.js'

type Call = { url: string; init: RequestInit }

const SHA = 'b'.repeat(40)
const TOKEN = 'token-de-prueba'
const ENV = { GITHUB_TOKEN: TOKEN, GITHUB_REPOSITORY: 'equipo/tienda', GITHUB_API_URL: 'https://github.example/api/v3' }

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const fakeFetch = (respond: (call: Call) => Response) => {
  const calls: Call[] = []
  const fetcher = async (input: string | URL | Request, init: RequestInit = {}) => {
    const call = { url: String(input), init }
    calls.push(call)
    return respond(call)
  }
  return { fetcher: fetcher as typeof fetch, calls }
}

const header = (call: Call | undefined, name: string) => new Headers(call?.init.headers).get(name)

describe('GitHub client', () => {
  it('needs a token and a repository from the environment', () => {
    const { error } = attemptSync(() => createGitHubClient({ GITHUB_REPOSITORY: 'equipo/tienda' }))
    expect(error).toBeInstanceOf(LeadFlowError)
    expect(attemptSync(() => createGitHubClient({ GITHUB_TOKEN: TOKEN, GITHUB_REPOSITORY: 'mal' })).error).not.toBeNull()
  })

  it('publishes a commit status on the given SHA with the token', async () => {
    const { fetcher, calls } = fakeFetch(() => jsonResponse({}, 201))
    const client = createGitHubClient(ENV, fetcher)
    await client.setCommitStatus(SHA, { state: 'success', context: 'lead-flow/integridad', description: 'bien' })
    expect(calls[0]?.url).toBe(`https://github.example/api/v3/repos/equipo/tienda/statuses/${SHA}`)
    expect(calls[0]?.init.method).toBe('POST')
    expect(header(calls[0], 'authorization')).toBe(`Bearer ${TOKEN}`)
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ state: 'success', context: 'lead-flow/integridad', description: 'bien' })
  })

  it('uses api.github.com when no API URL is given', async () => {
    const { fetcher, calls } = fakeFetch(() => jsonResponse({}, 201))
    const client = createGitHubClient({ GITHUB_TOKEN: TOKEN, GITHUB_REPOSITORY: 'equipo/tienda' }, fetcher)
    await client.setCommitStatus(SHA, { state: 'failure', context: 'lead-flow/integridad', description: 'mal' })
    expect(calls[0]?.url.startsWith('https://api.github.com/repos/equipo/tienda/')).toBe(true)
  })

  it('returns null for a file that does not exist on that commit', async () => {
    const { fetcher, calls } = fakeFetch(() => new Response('Not Found', { status: 404 }))
    const client = createGitHubClient(ENV, fetcher)
    expect(await client.getFile('.github/workflows/lead-flow-puertas.yml', SHA)).toBeNull()
    expect(calls[0]?.url).toContain(`/contents/.github/workflows/lead-flow-puertas.yml?ref=${SHA}`)
    expect(header(calls[0], 'accept')).toBe('application/vnd.github.raw+json')
  })

  it('reads a pull request', async () => {
    const body = { number: 7, head: { sha: SHA }, base: { sha: 'a'.repeat(40) }, user: { login: 'pedro-dev' }, changed_files: 2 }
    const { fetcher } = fakeFetch(() => jsonResponse(body))
    const pullRequest = await createGitHubClient(ENV, fetcher).getPullRequest(7)
    expect(pullRequest).toEqual({ number: 7, headSha: SHA, baseSha: 'a'.repeat(40), author: 'pedro-dev', changedFiles: 2 })
  })

  it('lists changed files across pages, with the old name of renamed files', async () => {
    const firstPage = Array.from({ length: 100 }, (_unused, index) => ({ filename: `src/f${index}.ts` }))
    const secondPage = [{ filename: 'src/nuevo.yml', previous_filename: '.github/workflows/lead-flow-puertas.yml' }]
    const pages: Record<string, unknown[]> = { '1': firstPage, '2': secondPage }
    const { fetcher, calls } = fakeFetch((call) => jsonResponse(pages[new URL(call.url).searchParams.get('page') ?? '']))
    const files = await createGitHubClient(ENV, fetcher).listChangedFiles(7)
    expect(files).toHaveLength(101)
    expect(files.at(-1)).toEqual({ path: 'src/nuevo.yml', previousPath: '.github/workflows/lead-flow-puertas.yml' })
    expect(calls).toHaveLength(2)
  })

  it('lists reviews with their commit and leaves out dismissed ones', async () => {
    const reviews = [
      { user: { login: 'ana-lead' }, state: 'APPROVED', submitted_at: '2026-11-19T10:00:00Z', commit_id: SHA },
      { user: { login: 'luis-sm' }, state: 'DISMISSED', submitted_at: '2026-11-19T11:00:00Z', commit_id: SHA },
    ]
    const { fetcher } = fakeFetch(() => jsonResponse(reviews))
    expect(await createGitHubClient(ENV, fetcher).listReviews(7)).toEqual([
      { usuario: 'ana-lead', estado: 'APPROVED', fecha: '2026-11-19T10:00:00Z', commitSha: SHA },
    ])
  })

  it('finds the open pull request whose head is the SHA', async () => {
    const pulls = [
      { number: 3, state: 'closed', head: { sha: SHA } },
      { number: 7, state: 'open', head: { sha: SHA } },
    ]
    const { fetcher, calls } = fakeFetch(() => jsonResponse(pulls))
    expect(await createGitHubClient(ENV, fetcher).findPullRequestNumber(SHA)).toBe(7)
    expect(calls[0]?.url).toContain(`/commits/${SHA}/pulls`)
  })

  it('reports an API error in Spanish without the token', async () => {
    const { fetcher } = fakeFetch(() => jsonResponse({ message: 'Resource not accessible by integration' }, 403))
    const { error } = await attempt(createGitHubClient(ENV, fetcher).getPullRequest(7))
    expect((error as LeadFlowError).code).toBe('GITHUB_ERROR')
    expect(error?.message).toContain('403')
    expect(error?.message).not.toContain(TOKEN)
  })

  it('rejects a SHA that is not a SHA before calling GitHub', async () => {
    const { fetcher, calls } = fakeFetch(() => jsonResponse({}))
    const { error } = await attempt(createGitHubClient(ENV, fetcher).getFile('AGENTS.md', '../main'))
    expect(error).toBeInstanceOf(LeadFlowError)
    expect(calls).toHaveLength(0)
  })
})
