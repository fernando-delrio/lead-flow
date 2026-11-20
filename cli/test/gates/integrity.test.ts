import { mkdtemp, readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { planWrite } from '../../src/generate/blocks.js'
import { renderAll } from '../../src/generate/all.js'
import type { RenderedFile } from '../../src/generate/outputs/types.js'
import { type IntegrityInput, checkIntegrity } from '../../src/gates/integrity.js'
import { runIntegrity } from '../../src/gates/run-integrity.js'
import type { ChangedFile, CommitReview, CommitStatus, GitHubClient, PullRequest } from '../../src/github/client.js'
import { type Policy, type Review, validatePolicy } from '../../src/policy/schema.js'

const POLICY_TEXT = readFileSync(new URL('../fixtures/politica-valida.yml', import.meta.url), 'utf8')
const HEAD_SHA = 'b'.repeat(40)
const OLD_SHA = 'c'.repeat(40)
const BASE_SHA = 'a'.repeat(40)
const WORKFLOW = '.github/workflows/lead-flow-puertas.yml'

const fixturePolicy = (): Policy => validatePolicy(parse(POLICY_TEXT))

const asWritten = (file: RenderedFile) => planWrite(null, file.content, file.style).contenido

const headMatching = (generated: RenderedFile[]) =>
  Object.fromEntries(generated.map((file) => [file.path, asWritten(file)]))

const withoutKey = (record: Record<string, string>, removed: string) =>
  Object.fromEntries(Object.entries(record).filter(([key]) => key !== removed))

const approval = (usuario: string, fecha = '2026-11-19T10:00:00Z'): Review => ({ usuario, estado: 'APPROVED', fecha })

const integrityInput = (overrides: Partial<IntegrityInput> = {}): IntegrityInput => {
  const policy = overrides.policy ?? fixturePolicy()
  const generatedOnBase = renderAll(policy)
  return {
    policy,
    changedFiles: [],
    generatedOnBase,
    filesOnHead: headMatching(generatedOnBase),
    approvals: [],
    author: 'pedro-dev',
    ...overrides,
  }
}

describe('checkIntegrity', () => {
  it('passes when nothing protected changes and the generated files match', () => {
    const evidence = checkIntegrity(integrityInput({ changedFiles: ['src/app.ts'] }))
    expect(evidence.estado).toBe('ok')
    expect(evidence.puerta).toBe('integridad')
  })

  it('fails when generated files differ from the policy', () => {
    const input = integrityInput()
    const edited = { ...input.filesOnHead, 'AGENTS.md': `${input.filesOnHead['AGENTS.md']}`.replace('npm test', 'true') }
    const evidence = checkIntegrity({ ...input, filesOnHead: edited })
    expect(evidence.estado).toBe('fallo')
    expect(evidence.resumen).toContain('AGENTS.md')
  })

  it('fails when a generated file is missing on the head', () => {
    const input = integrityInput()
    const evidence = checkIntegrity({ ...input, filesOnHead: withoutKey(input.filesOnHead, WORKFLOW) })
    expect(evidence.estado).toBe('fallo')
    expect(evidence.resumen).toContain(WORKFLOW)
  })

  it('flags workflow changes made in the pull request', () => {
    const evidence = checkIntegrity(integrityInput({ changedFiles: [WORKFLOW, 'src/app.ts'] }))
    expect(evidence.estado).toBe('fallo')
    expect(evidence.resumen).toContain(WORKFLOW)
    expect(evidence.resumen).toContain('@ana-lead')
    expect(evidence.resumen).not.toContain('src/app.ts')
  })

  it('flags a tool configuration change without the approval of the lead', () => {
    const changedFiles = ['.gitleaksignore', 'src/.semgrepignore', '.gitleaks.toml', '.semgrep.yml']
    const evidence = checkIntegrity(integrityInput({ changedFiles, approvals: [approval('marta-qa')] }))
    expect(evidence.estado).toBe('fallo')
    for (const file of changedFiles) expect(evidence.resumen).toContain(file)
  })

  it('accepts .lead changes approved by the scrum master when the lead is the author', () => {
    const input = integrityInput({
      changedFiles: ['.lead/politica.yml'],
      author: 'ana-lead',
      approvals: [approval('luis-sm')],
    })
    const evidence = checkIntegrity(input)
    expect(evidence.estado).toBe('ok')
    expect(evidence.resumen).toContain('@luis-sm')
  })

  it('does not take the approval of the lead for her own pull request', () => {
    const input = integrityInput({ changedFiles: ['.lead/politica.yml'], author: 'ana-lead', approvals: [approval('ana-lead')] })
    expect(checkIntegrity(input).estado).toBe('fallo')
  })

  it('fails when the lead is the author and there is no scrum master', () => {
    const policy = fixturePolicy()
    const withoutScrumMaster = { ...policy, equipo: { ...policy.equipo, scrum_master: '' } }
    const input = integrityInput({ policy: withoutScrumMaster, changedFiles: ['.lead/politica.yml'], author: 'ana-lead' })
    const evidence = checkIntegrity(input)
    expect(evidence.estado).toBe('fallo')
    expect(evidence.resumen).toContain('scrum master')
  })

  it('accepts regenerated files when the lead approves the change', () => {
    const input = integrityInput()
    const regenerated = { ...input.filesOnHead, 'AGENTS.md': `${input.filesOnHead['AGENTS.md']}`.replace('npm test', 'npm run test:ci') }
    const evidence = checkIntegrity({
      ...input,
      filesOnHead: regenerated,
      changedFiles: ['.lead/politica.yml', 'AGENTS.md'],
      approvals: [approval('Ana-Lead')],
    })
    expect(evidence.estado).toBe('ok')
  })

  it('keeps failing on drift in files the pull request did not touch, even with approval', () => {
    const input = integrityInput()
    const drifted = { ...input.filesOnHead, 'CLAUDE.md': 'escrito a mano' }
    const evidence = checkIntegrity({ ...input, filesOnHead: drifted, approvals: [approval('ana-lead')] })
    expect(evidence.estado).toBe('fallo')
    expect(evidence.resumen).toContain('CLAUDE.md')
  })

  it('lets a later request for changes cancel an earlier approval', () => {
    const changesRequested: Review = { usuario: 'ana-lead', estado: 'CHANGES_REQUESTED', fecha: '2026-11-19T12:00:00Z' }
    const comment: Review = { usuario: 'ana-lead', estado: 'COMMENTED', fecha: '2026-11-19T13:00:00Z' }
    const input = integrityInput({ changedFiles: [WORKFLOW], approvals: [comment, changesRequested, approval('ana-lead')] })
    expect(checkIntegrity(input).estado).toBe('fallo')
  })

  it('keeps an approval when a later review is only a comment', () => {
    const comment: Review = { usuario: 'ana-lead', estado: 'COMMENTED', fecha: '2026-11-19T13:00:00Z' }
    const input = integrityInput({ changedFiles: [WORKFLOW], approvals: [comment, approval('ana-lead')] })
    expect(checkIntegrity(input).estado).toBe('ok')
  })
})

type FakeCalls = { statuses: Array<{ sha: string; status: CommitStatus }>; reviewsFor: number[]; lookups: string[] }

type FakeSetup = { changed?: ChangedFile[]; reviews?: CommitReview[]; changedCount?: number; files?: Record<string, string> }

const fakeFiles = () => ({ ...headMatching(renderAll(fixturePolicy())), '.lead/politica.yml': POLICY_TEXT })

const fakeClient = (setup: FakeSetup = {}) => {
  const calls: FakeCalls = { statuses: [], reviewsFor: [], lookups: [] }
  const changed = setup.changed ?? [{ path: 'src/app.ts', previousPath: null }]
  const pullRequest: PullRequest = {
    number: 7,
    headSha: HEAD_SHA,
    baseSha: BASE_SHA,
    author: 'pedro-dev',
    changedFiles: setup.changedCount ?? changed.length,
  }
  const files = setup.files ?? fakeFiles()
  const client: GitHubClient = {
    getPullRequest: async () => pullRequest,
    findPullRequestNumber: async (sha) => {
      calls.lookups.push(sha)
      return 7
    },
    listChangedFiles: async () => changed,
    listReviews: async (number) => {
      calls.reviewsFor.push(number)
      return setup.reviews ?? []
    },
    getFile: async (path) => files[path] ?? null,
    setCommitStatus: async (sha, status) => {
      calls.statuses.push({ sha, status })
    },
  }
  return { client, calls }
}

const evidenceDirectory = () => mkdtemp(join(tmpdir(), 'lead-flow-evidencias-'))

const pullRequestEnv = { LEAD_FLOW_EVENTO: 'pull_request_target', LEAD_FLOW_PR: '7', LEAD_FLOW_HEAD_SHA: '' }

describe('runIntegrity', () => {
  it('publishes lead-flow/integridad on the head SHA and writes the evidence', async () => {
    const { client, calls } = fakeClient({ changed: [{ path: WORKFLOW, previousPath: null }] })
    const directory = await evidenceDirectory()
    const evidence = await runIntegrity({ env: pullRequestEnv, client, evidenceDirectory: directory })
    expect(evidence.estado).toBe('fallo')
    expect(calls.statuses).toHaveLength(1)
    expect(calls.statuses[0]?.sha).toBe(HEAD_SHA)
    expect(calls.statuses[0]?.status.context).toBe('lead-flow/integridad')
    expect(calls.statuses[0]?.status.state).toBe('failure')
    expect(calls.statuses[0]?.status.description.length).toBeLessThanOrEqual(140)
    const written = JSON.parse(await readFile(join(directory, 'integridad.json'), 'utf8'))
    expect(written.estado).toBe('fallo')
  })

  it('publishes success when integrity passes', async () => {
    const { client, calls } = fakeClient()
    const evidence = await runIntegrity({ env: pullRequestEnv, client, evidenceDirectory: await evidenceDirectory() })
    expect(evidence.estado).toBe('ok')
    expect(calls.statuses[0]?.status.state).toBe('success')
  })

  it('finds the pull request from the head SHA on workflow_run', async () => {
    const { client, calls } = fakeClient()
    const env = { LEAD_FLOW_EVENTO: 'workflow_run', LEAD_FLOW_PR: '', LEAD_FLOW_HEAD_SHA: OLD_SHA }
    await runIntegrity({ env, client, evidenceDirectory: await evidenceDirectory() })
    expect(calls.lookups).toEqual([OLD_SHA])
    expect(calls.reviewsFor).toEqual([7])
    expect(calls.statuses[0]?.sha).toBe(HEAD_SHA)
  })

  it('ignores approvals given to an older commit', async () => {
    const stale: CommitReview = { ...approval('ana-lead'), commitSha: OLD_SHA }
    const { client } = fakeClient({ changed: [{ path: 'src/x.ts', previousPath: WORKFLOW }], reviews: [stale] })
    const evidence = await runIntegrity({ env: pullRequestEnv, client, evidenceDirectory: await evidenceDirectory() })
    expect(evidence.estado).toBe('fallo')
    expect(evidence.resumen).toContain(WORKFLOW)
  })

  it('counts an approval given to the head commit', async () => {
    const current: CommitReview = { ...approval('ana-lead'), commitSha: HEAD_SHA }
    const { client } = fakeClient({ changed: [{ path: WORKFLOW, previousPath: null }], reviews: [current] })
    const evidence = await runIntegrity({ env: pullRequestEnv, client, evidenceDirectory: await evidenceDirectory() })
    expect(evidence.estado).toBe('ok')
  })

  it('reports no_verificado when GitHub lists fewer files than the pull request has', async () => {
    const { client, calls } = fakeClient({ changedCount: 3001 })
    const evidence = await runIntegrity({ env: pullRequestEnv, client, evidenceDirectory: await evidenceDirectory() })
    expect(evidence.estado).toBe('no_verificado')
    expect(calls.statuses[0]?.status.state).toBe('failure')
  })

  it('reports no_verificado when the base branch has no policy', async () => {
    const { client, calls } = fakeClient({ files: withoutKey(fakeFiles(), '.lead/politica.yml') })
    const evidence = await runIntegrity({ env: pullRequestEnv, client, evidenceDirectory: await evidenceDirectory() })
    expect(evidence.estado).toBe('no_verificado')
    expect(calls.statuses[0]?.status.state).toBe('failure')
  })

  it('reports no_verificado without a pull request to look at', async () => {
    const { client, calls } = fakeClient()
    const env = { LEAD_FLOW_EVENTO: 'pull_request_target', LEAD_FLOW_PR: 'siete', LEAD_FLOW_HEAD_SHA: '' }
    const evidence = await runIntegrity({ env, client, evidenceDirectory: await evidenceDirectory() })
    expect(evidence.estado).toBe('no_verificado')
    expect(calls.statuses).toHaveLength(0)
  })
})
