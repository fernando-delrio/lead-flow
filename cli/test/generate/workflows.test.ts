import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { renderWorkflows } from '../../src/generate/outputs/workflows.js'
import { type Policy, validatePolicy } from '../../src/policy/schema.js'

type Step = { uses?: string; run?: string; if?: string; with?: Record<string, unknown>; env?: Record<string, string> }
type Job = { if?: string; needs?: string; permissions?: unknown; 'timeout-minutes'?: number; steps: Step[] }
type Concurrency = { group: string; 'cancel-in-progress': boolean }
type Workflow = {
  name: string
  on: Record<string, unknown>
  permissions: unknown
  concurrency?: Concurrency
  jobs: Record<string, Job>
}
type Action = {
  inputs: Record<string, { required?: boolean }>
  runs: { using: string; steps: Step[] }
}

const GATE_ACTION = 'fernando-delrio/lead-flow/acciones/puertas@v0'
const FIRST_PARTY_PREFIX = 'fernando-delrio/lead-flow/'
const PINNED_USES = /^[\w-]+\/[\w.-]+(\/[\w./-]+)?@[0-9a-f]{40}$/
const VERSION_COMMENT = /# v\d+\.\d+\.\d+$/
const GATES = ['pruebas', 'secretos', 'sast', 'dependencias']
const TRUSTED_WORKFLOWS = [
  'lead-flow-decision.yml',
  'lead-flow-informe.yml',
  'lead-flow-excepciones.yml',
  'lead-flow-parte.yml',
]
const PER_PULL_REQUEST_WORKFLOWS = ['lead-flow-puertas.yml', 'lead-flow-decision.yml']
const HEAD_REFERENCES = ['github.event.pull_request.head', 'github.head_ref', 'refs/pull/', 'workflow_run.head_branch']
const BASE_SHA = '${{ github.event.pull_request.base.sha }}'
const REPOSITORY_TOKEN = '${{ secrets.GITHUB_TOKEN }}'
const WRITING_TOKEN = '${{ secrets.LEAD_FLOW_TOKEN || secrets.GITHUB_TOKEN }}'
// Quien abre pull requests, activa la integración automática o escribe informes usa el token opcional.
const EXPECTED_TOKENS: Record<string, string> = {
  integridad: REPOSITORY_TOKEN,
  aprobacion: WRITING_TOKEN,
  informe: WRITING_TOKEN,
  pendientes: WRITING_TOKEN,
  excepcion: WRITING_TOKEN,
  parte: REPOSITORY_TOKEN,
}
const DECISION_JOBS = ['integridad', 'aprobacion']
const PULL_REQUEST_TRIGGER =
  "github.event_name == 'pull_request_target' || " +
  `contains(fromJSON('["pull_request","pull_request_review"]'), github.event.workflow_run.event)`
const PULL_REQUEST_LOCATOR = {
  LEAD_FLOW_EVENTO: '${{ github.event_name }}',
  LEAD_FLOW_PR: '${{ github.event.pull_request.number }}',
  LEAD_FLOW_HEAD_SHA: '${{ github.event.workflow_run.head_sha }}',
}
const WORKFLOWS_WITH_WRITING_TOKEN = ['lead-flow-decision.yml', 'lead-flow-informe.yml', 'lead-flow-excepciones.yml']
const LEAD_FLOW_TOKEN_WARNING = 'LEAD_FLOW_TOKEN no respeta permissions:'
const ACTION_URL = new URL('../../../acciones/puertas/action.yml', import.meta.url)

const fixturePolicy = (): Policy =>
  validatePolicy(parse(readFileSync(new URL('../fixtures/politica-valida.yml', import.meta.url), 'utf8')))

const withDigestHour = (digestHour: string): Policy => {
  const policy = fixturePolicy()
  return { ...policy, parte: { ...policy.parte, hora_utc: digestHour } }
}

const renderedTexts = (policy: Policy = fixturePolicy()) =>
  new Map(renderWorkflows(policy).map((file) => [basename(file.path), file.content]))

const renderedWorkflows = (policy: Policy = fixturePolicy()) =>
  new Map([...renderedTexts(policy)].map(([name, text]) => [name, parse(text) as Workflow]))

const workflow = (name: string, policy?: Policy) => renderedWorkflows(policy).get(name) as Workflow

const actionText = () => readFileSync(ACTION_URL, 'utf8')

const action = () => parse(actionText()) as Action

const workflowSteps = () =>
  [...renderedWorkflows().values()].flatMap((flow) => Object.values(flow.jobs).flatMap((job) => job.steps))

const allSteps = () => [...workflowSteps(), ...action().runs.steps]

const usesLines = () =>
  [...renderedTexts().values(), actionText()]
    .flatMap((text) => text.split(/\r?\n/))
    .filter((line) => /^\s*(-\s+)?uses:/.test(line))

const usesAction = (name: string) => (step: Step) => (step.uses ?? '').startsWith(`${name}@`)

const isCheckout = usesAction('actions/checkout')

const decisionJob = (name: string) => workflow('lead-flow-decision.yml').jobs[name] as Job

const actionStepText = (pattern: RegExp) =>
  JSON.stringify(action().runs.steps.filter((step) => pattern.test(JSON.stringify(step))))

describe('renderWorkflows', () => {
  it('writes the six workflows into .github/workflows with hash comments', () => {
    const files = renderWorkflows(fixturePolicy())
    expect(files.map((file) => file.path)).toEqual([
      '.github/workflows/lead-flow-puertas.yml',
      '.github/workflows/lead-flow-resena.yml',
      '.github/workflows/lead-flow-decision.yml',
      '.github/workflows/lead-flow-informe.yml',
      '.github/workflows/lead-flow-excepciones.yml',
      '.github/workflows/lead-flow-parte.yml',
    ])
    expect(files.every((file) => 'style' in file && file.style === 'hash')).toBe(true)
  })

  it('jobs that run pull request code use pull_request', () => {
    const gates = workflow('lead-flow-puertas.yml')
    expect(Object.keys(gates.on)).toEqual(['pull_request'])
    expect(Object.keys(gates.jobs)).toEqual(GATES)
    GATES.forEach((gate) => {
      const step = gates.jobs[gate]!.steps.find((candidate) => candidate.uses === GATE_ACTION)
      expect(step?.with).toEqual({ puerta: gate })
    })
  })

  it('only the gate workflow listens to pull_request', () => {
    TRUSTED_WORKFLOWS.forEach((name) => expect(Object.keys(workflow(name).on)).not.toContain('pull_request'))
  })

  it('the review workflow only wakes the decision up, with no permissions or tools', () => {
    const review = workflow('lead-flow-resena.yml')
    expect(review.on).toEqual({ pull_request_review: { types: ['submitted', 'edited', 'dismissed'] } })
    expect(review.permissions).toEqual({})
    Object.values(review.jobs).forEach((job) => {
      expect(job.permissions).toEqual({})
      expect(job.steps.filter((step) => step.uses !== undefined)).toEqual([])
    })
    expect(renderedTexts().get('lead-flow-resena.yml')).not.toContain('secrets.')
  })

  it('decision listens to pull_request_target and to the gate and review runs', () => {
    const decision = workflow('lead-flow-decision.yml')
    expect(Object.keys(decision.on)).toEqual(['pull_request_target', 'workflow_run'])
    expect(decision.on).not.toHaveProperty('pull_request_review')
    const names = [workflow('lead-flow-puertas.yml').name, workflow('lead-flow-resena.yml').name]
    expect(decision.on.workflow_run).toEqual({ workflows: names, types: ['completed'] })
    expect(Object.keys(decision.jobs)).toEqual(['integridad', 'aprobacion'])
  })

  it('both decision jobs run on every trigger of a pull request', () => {
    const condition = decisionJob('integridad').if
    expect(condition).toBe(PULL_REQUEST_TRIGGER)
    expect(condition).toContain("github.event_name == 'pull_request_target'")
    expect(condition).toContain(`contains(fromJSON('["pull_request","pull_request_review"]'), github.event.workflow_run.event)`)
  })

  it('approval waits for integrity and runs even when it fails', () => {
    const approval = decisionJob('aprobacion')
    expect(approval.needs).toBe('integridad')
    expect(approval.if).toBe(`!cancelled() && (${PULL_REQUEST_TRIGGER})`)
    const cliStep = approval.steps.find((step) => step.uses === GATE_ACTION)
    expect(cliStep?.env?.INTEGRIDAD_RESULTADO).toBe('${{ needs.integridad.result }}')
  })

  it('decision jobs hand the CLI only what it needs to find the pull request', () => {
    DECISION_JOBS.forEach((name) => {
      const cliStep = decisionJob(name).steps.find((step) => step.uses === GATE_ACTION)
      expect(cliStep?.env).toMatchObject(PULL_REQUEST_LOCATOR)
    })
  })

  it('the decision reads evidence only through the CLI, never with download steps', () => {
    const text = renderedTexts().get('lead-flow-decision.yml')
    const steps = Object.values(workflow('lead-flow-decision.yml').jobs).flatMap((job) => job.steps)
    expect(steps.filter(usesAction('actions/download-artifact'))).toEqual([])
    expect(text).not.toContain('workflow_run.path')
    expect(text).not.toContain('LEAD_FLOW_EVIDENCIAS_PR')
  })

  it('decision jobs never check out the pull request head', () => {
    const texts = renderedTexts()
    expect(texts.get('lead-flow-decision.yml')).not.toContain('github.event.pull_request.head')
    TRUSTED_WORKFLOWS.forEach((name) => {
      HEAD_REFERENCES.forEach((reference) => expect(texts.get(name)).not.toContain(reference))
    })
  })

  it('decision and report check out the base commit', () => {
    const jobs = [decisionJob('integridad'), decisionJob('aprobacion'), workflow('lead-flow-informe.yml').jobs.informe!]
    jobs.forEach((job) => {
      const checkouts = job.steps.filter(isCheckout)
      expect(checkouts).toHaveLength(1)
      expect(checkouts[0]!.with?.ref).toBe(BASE_SHA)
    })
  })

  it('trusted workflows never run a script of their own', () => {
    TRUSTED_WORKFLOWS.forEach((name) => {
      const steps = Object.values(workflow(name).jobs).flatMap((job) => job.steps)
      expect(steps.filter((step) => step.run !== undefined)).toEqual([])
    })
  })

  it('integrity can publish its commit status and nothing else is written', () => {
    expect(decisionJob('integridad').permissions).toEqual({
      contents: 'read',
      'pull-requests': 'read',
      statuses: 'write',
    })
  })

  it('approval keeps the permission to list gate runs and download their artifacts', () => {
    expect(decisionJob('aprobacion').permissions).toMatchObject({ actions: 'read' })
  })

  it('both report jobs share one queue that never cancels', () => {
    expect(workflow('lead-flow-informe.yml').concurrency).toEqual({
      group: 'lead-flow-informes',
      'cancel-in-progress': false,
    })
  })

  it('warns that LEAD_FLOW_TOKEN ignores the job permissions wherever it is used', () => {
    const texts = renderedTexts()
    const withToken = [...texts].filter(([, text]) => text.includes('secrets.LEAD_FLOW_TOKEN'))
    expect(withToken.map(([name]) => name)).toEqual(WORKFLOWS_WITH_WRITING_TOKEN)
    withToken.forEach(([, text]) => expect(text).toContain(LEAD_FLOW_TOKEN_WARNING))
  })

  it('report runs for merged pull requests and in a daily sweep', () => {
    const report = workflow('lead-flow-informe.yml')
    expect(report.on).toEqual({
      pull_request_target: { types: ['closed'] },
      schedule: [{ cron: '0 8 * * 1-5' }],
      workflow_dispatch: null,
    })
    expect(report.jobs.informe!.if).toBe(
      "github.event_name == 'pull_request_target' && github.event.pull_request.merged == true",
    )
    expect(report.jobs.pendientes!.if).toBe("github.event_name != 'pull_request_target'")
    const sweep = report.jobs.pendientes!.steps.find((step) => step.uses === GATE_ACTION)
    expect(sweep?.with?.puerta).toBe('informe-pendientes')
  })

  it('the report sweep runs one hour after the digest, also across midnight', () => {
    const late = workflow('lead-flow-informe.yml', withDigestHour('23:30'))
    expect(late.on.schedule).toEqual([{ cron: '30 0 * * 2-6' }])
  })

  it('exceptions listen to issue comments', () => {
    expect(Object.keys(workflow('lead-flow-excepciones.yml').on)).toEqual(['issue_comment'])
  })

  it('exceptions only start for members commenting a command on an exception issue', () => {
    const exceptions = workflow('lead-flow-excepciones.yml')
    const condition = exceptions.jobs.excepcion!.if
    expect(condition).toContain(
      `contains(fromJSON('["OWNER","MEMBER","COLLABORATOR"]'), github.event.comment.author_association)`,
    )
    expect(condition).toContain("contains(github.event.issue.labels.*.name, 'excepcion')")
    expect(condition).toContain('!github.event.issue.pull_request')
    expect(condition).toContain("startsWith(github.event.comment.body, '/aprobar')")
    expect(condition).toContain("startsWith(github.event.comment.body, '/rechazar')")
    expect(exceptions.concurrency).toEqual({
      group: 'lead-flow-excepciones-${{ github.event.issue.number }}',
      'cancel-in-progress': false,
    })
  })

  it('cron matches parte.hora_utc on weekdays', () => {
    const digest = workflow('lead-flow-parte.yml')
    expect(digest.on.schedule).toEqual([{ cron: '0 7 * * 1-5' }])
    expect(Object.keys(digest.on)).toContain('workflow_dispatch')
    expect(workflow('lead-flow-parte.yml', withDigestHour('18:05')).on.schedule).toEqual([{ cron: '5 18 * * 1-5' }])
  })

  it('every job declares explicit permissions', () => {
    renderedWorkflows().forEach((flow) => {
      expect(flow.permissions).toEqual({})
      Object.values(flow.jobs).forEach((job) => {
        expect(job.permissions).not.toBeNull()
        expect(job.permissions).toBeTypeOf('object')
        expect(JSON.stringify(job.permissions)).not.toMatch(/write-all|read-all/)
      })
    })
  })

  it('gate jobs only read the repository', () => {
    Object.values(workflow('lead-flow-puertas.yml').jobs).forEach((job) =>
      expect(job.permissions).toEqual({ contents: 'read' }),
    )
  })

  it('every job has a time limit', () => {
    renderedWorkflows().forEach((flow) => {
      Object.values(flow.jobs).forEach((job) => expect(job['timeout-minutes']).toBeTypeOf('number'))
    })
  })

  it('passes each token as an input, only to trusted jobs', () => {
    expect(renderedTexts().get('lead-flow-puertas.yml')).not.toContain('secrets.')
    TRUSTED_WORKFLOWS.forEach((name) => {
      Object.entries(workflow(name).jobs).forEach(([jobName, job]) => {
        const cliSteps = job.steps.filter((step) => step.uses === GATE_ACTION)
        expect(cliSteps).toHaveLength(1)
        expect(cliSteps[0]!.with?.token).toBe(EXPECTED_TOKENS[jobName])
      })
    })
  })

  it('never puts a secret in a step environment', () => {
    workflowSteps().forEach((step) => expect(JSON.stringify(step.env ?? {})).not.toContain('secrets.'))
  })

  it('cancels stale runs per pull request', () => {
    PER_PULL_REQUEST_WORKFLOWS.forEach((name) => {
      const concurrency = workflow(name).concurrency
      expect(concurrency?.group).toContain('github.event.pull_request.number')
      expect(concurrency?.['cancel-in-progress']).toBe(true)
    })
  })

  it('checks out without persisting credentials', () => {
    const checkouts = allSteps().filter(isCheckout)
    expect(checkouts.length).toBeGreaterThan(0)
    checkouts.forEach((step) => expect(step.with?.['persist-credentials']).toBe(false))
  })

  it('pins every external action to a full commit SHA with its version', () => {
    const lines = usesLines()
    expect(lines.length).toBeGreaterThan(0)
    lines
      .filter((line) => !line.includes(FIRST_PARTY_PREFIX))
      .forEach((line) => {
        const reference = line.replace(/^\s*(-\s+)?uses:\s*/, '').replace(/\s*#.*$/, '')
        expect(reference).toMatch(PINNED_USES)
        expect(line).toMatch(VERSION_COMMENT)
      })
  })

  it('never interpolates expressions into run scripts', () => {
    const scripts = allSteps()
      .map((step) => step.run)
      .filter((script): script is string => script !== undefined)
    expect(scripts.length).toBeGreaterThan(0)
    scripts.forEach((script) => expect(script).not.toContain('${{'))
  })
})

describe('gate action', () => {
  it('is a composite action with a required puerta and an optional token', () => {
    expect(action().runs.using).toBe('composite')
    expect(Object.keys(action().inputs)).toEqual(['puerta', 'token'])
    expect(action().inputs.puerta?.required).toBe(true)
    expect(action().inputs.token?.required).toBe(false)
  })

  it('builds the CLI from this repository with Node 24 and no cache', () => {
    const setupNode = action().runs.steps.find(usesAction('actions/setup-node'))
    expect(setupNode?.with).toEqual({ 'node-version': '24', 'package-manager-cache': false })
    expect(actionStepText(/npm ci/)).toContain('$GITHUB_ACTION_PATH/../../cli')
    expect(actionStepText(/npm ci/)).toContain('npm ci --ignore-scripts')
    expect(actionStepText(/npm run build/)).not.toBe('[]')
  })

  it('installs exact versions of gitleaks and semgrep', () => {
    expect(actionStepText(/GITLEAKS_VERSION/)).toMatch(/"GITLEAKS_VERSION":"\d+\.\d+\.\d+"/)
    expect(actionStepText(/GITLEAKS_SHA256/)).toMatch(/"GITLEAKS_SHA256":"[0-9a-f]{64}"/)
    expect(actionStepText(/SEMGREP_VERSION/)).toMatch(/"SEMGREP_VERSION":"\d+\.\d+\.\d+"/)
    expect(actionStepText(/semgrep==/)).toContain('pip install')
  })

  it('gives the token only to the step that runs the CLI', () => {
    const withToken = action().runs.steps.filter((step) => JSON.stringify(step).includes('inputs.token'))
    expect(withToken).toHaveLength(1)
    expect(withToken[0]!.env?.GITHUB_TOKEN).toBe('${{ inputs.token }}')
    expect(withToken[0]!.run).toContain('dist/index.js')
  })

  it('maps each puerta to its CLI command through a closed table', () => {
    const script = action().runs.steps.find((step) => (step.run ?? '').includes('dist/index.js'))?.run ?? ''
    expect(script).toContain('[secretos]="puerta secretos"')
    expect(script).toContain('[integridad]="integridad"')
    expect(script).toContain('[informe-pendientes]="informe --pendientes"')
  })

  it('uploads the evidence of each gate', () => {
    const upload = action().runs.steps.find(usesAction('actions/upload-artifact'))
    expect(upload?.with).toMatchObject({
      name: 'lead-flow-evidencias-${{ inputs.puerta }}',
      path: 'lead-flow-evidencias/${{ inputs.puerta }}.json',
    })
  })
})
