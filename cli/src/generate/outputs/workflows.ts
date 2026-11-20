import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { attemptSync } from '../../core/attempt.js'
import { LeadFlowError } from '../../core/errors.js'
import type { Policy } from '../../policy/schema.js'
import type { RenderedFile } from './types.js'

type Placeholder = [token: string, value: string]

// Desde src/ y desde dist/ la raíz del repositorio queda a la misma distancia.
const TEMPLATES_PATH = '../../../../plantillas/workflows/'
const WORKFLOWS_DIR = '.github/workflows'
const WORKFLOW_FILES = [
  'lead-flow-puertas.yml',
  'lead-flow-resena.yml',
  'lead-flow-decision.yml',
  'lead-flow-informe.yml',
  'lead-flow-excepciones.yml',
  'lead-flow-parte.yml',
]
const DIGEST_CRON_PLACEHOLDER = '__CRON_PARTE__'
const REPORT_SWEEP_CRON_PLACEHOLDER = '__CRON_INFORMES__'
const WEEKDAYS = '1-5'
const DAYS_AFTER_WEEKDAYS = '2-6'
const HOURS_PER_DAY = 24
const REPORT_SWEEP_DELAY_HOURS = 1
const TEMPLATE_READ_FAILED_CODE = 'PLANTILLA_ILEGIBLE'

const parseHour = (horaUtc: string) => {
  const [hour, minute] = horaUtc.split(':').map(Number)
  return { hour: hour as number, minute: minute as number }
}

export const digestCron = (horaUtc: string) => {
  const { hour, minute } = parseHour(horaUtc)
  return `${minute} ${hour} * * ${WEEKDAYS}`
}

// Si una hora más pasa de medianoche, la pasada cae al día siguiente: de martes a sábado.
const sweepDays = (sweepHour: number) => {
  if (sweepHour < HOURS_PER_DAY) return WEEKDAYS
  return DAYS_AFTER_WEEKDAYS
}

export const reportSweepCron = (horaUtc: string) => {
  const { hour, minute } = parseHour(horaUtc)
  const sweepHour = hour + REPORT_SWEEP_DELAY_HOURS
  return `${minute} ${sweepHour % HOURS_PER_DAY} * * ${sweepDays(sweepHour)}`
}

const placeholdersFor = (policy: Policy): Placeholder[] => [
  [DIGEST_CRON_PLACEHOLDER, digestCron(policy.parte.hora_utc)],
  [REPORT_SWEEP_CRON_PLACEHOLDER, reportSweepCron(policy.parte.hora_utc)],
]

const readTemplate = (file: string) => {
  const url = new URL(`${TEMPLATES_PATH}${file}`, import.meta.url)
  const { value, error } = attemptSync(() => readFileSync(url, 'utf8'))
  if (!error) return value
  throw new LeadFlowError(
    TEMPLATE_READ_FAILED_CODE,
    `No se puede leer la plantilla ${fileURLToPath(url)}: ${error.message}`
  )
}

const fillPlaceholders = (template: string, placeholders: Placeholder[]) =>
  placeholders.reduce((text, [token, value]) => text.replaceAll(token, value), template)

const renderWorkflow = (file: string, placeholders: Placeholder[]): RenderedFile => ({
  path: `${WORKFLOWS_DIR}/${file}`,
  style: 'hash',
  content: fillPlaceholders(readTemplate(file), placeholders),
})

export const renderWorkflows = (policy: Policy): RenderedFile[] => {
  const placeholders = placeholdersFor(policy)
  return WORKFLOW_FILES.map((file) => renderWorkflow(file, placeholders))
}
