import { readFileSync } from 'node:fs'
import { attemptSync } from './attempt.js'

// Desde src/ y desde dist/ el package.json queda a la misma distancia.
const PACKAGE_URL = new URL('../../package.json', import.meta.url)
const UNKNOWN_VERSION = 'desconocida'

const readPackageVersion = () => {
  const { value, error } = attemptSync(() => JSON.parse(readFileSync(PACKAGE_URL, 'utf8')) as { version?: unknown })
  if (error || typeof value.version !== 'string') return UNKNOWN_VERSION
  return value.version
}

export const CLI_VERSION = readPackageVersion()
