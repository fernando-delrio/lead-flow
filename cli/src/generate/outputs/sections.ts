const BACKTICK_RUN = /`+/g

export const renderList = (items: string[]) => items.map((item) => `- ${item}`)

// CommonMark: la valla del código debe ser más larga que cualquier racha de acentos graves del texto.
export const renderCode = (text: string) => {
  const longestRun = Math.max(0, ...[...text.matchAll(BACKTICK_RUN)].map((match) => match[0].length))
  const fence = '`'.repeat(longestRun + 1)
  if (longestRun === 0) return `${fence}${text}${fence}`
  return `${fence} ${text} ${fence}`
}

// Una sección sin contenido no se imprime: nada de marcadores vacíos.
export const renderSection = (title: string, lines: string[]) => {
  if (lines.length === 0) return []
  return [`## ${title}`, ...lines, '']
}

export const renderLabeled = (label: string, values: string[]) => {
  if (values.length === 0) return []
  return [`- ${label}: ${values.map(renderCode).join(', ')}.`]
}
