import { stringify } from 'yaml'
import type { RenderedFile } from './types.js'

const ISSUE_DIR = '.github/ISSUE_TEMPLATE'

type IssueField = { id: string; label: string; required: boolean }
type IssueForm = { name: string; description: string; labels: string[]; fields: IssueField[] }

const toTextarea = ({ id, label, required }: IssueField) => ({
  type: 'textarea',
  id,
  attributes: { label },
  validations: { required },
})

const renderIssueForm = (form: IssueForm) =>
  stringify({
    name: form.name,
    description: form.description,
    labels: form.labels,
    body: form.fields.map(toTextarea),
  })

export const renderExceptionTemplate = (): RenderedFile => ({
  path: `${ISSUE_DIR}/excepcion.yml`,
  style: 'hash',
  content: renderIssueForm({
    name: 'Excepción a la política',
    description: 'Pide una excepción temporal a una regla de la política del equipo',
    labels: ['excepcion'],
    fields: [
      { id: 'que', label: 'Qué se pide', required: true },
      { id: 'ticket', label: 'Ticket', required: true },
      { id: 'porque', label: 'Por qué', required: true },
      { id: 'alternativas', label: 'Alternativas descartadas', required: true },
      { id: 'bloquea', label: 'Qué bloquea si no se concede', required: true },
    ],
  }),
})

export const renderProductionFailureTemplate = (): RenderedFile => ({
  path: `${ISSUE_DIR}/fallo-produccion.yml`,
  style: 'hash',
  content: renderIssueForm({
    name: 'Fallo en producción',
    description: 'Cuenta un fallo ocurrido en producción',
    labels: ['fallo-produccion'],
    fields: [
      { id: 'que', label: 'Qué ha pasado', required: true },
      { id: 'cuando', label: 'Cuándo se detectó', required: true },
      { id: 'cambio', label: 'Cambio o ticket relacionado', required: false },
      { id: 'impacto', label: 'A quién afecta', required: false },
    ],
  }),
})

export const renderPullRequestTemplate = (): RenderedFile => ({
  path: '.github/pull_request_template.md',
  style: 'markdown',
  content: [
    '## Qué cambia',
    '',
    '## Ticket',
    '',
    'Número del ticket: #',
    '',
    '## Agente y modelo usados',
    '',
    'Si no se usó ninguno, escribe «ninguno».',
  ].join('\n'),
})
