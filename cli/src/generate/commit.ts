import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { attempt } from '../core/attempt.js'
import { LeadFlowError } from '../core/errors.js'

export type PendingFile = { absolute: string; contenido: string; previous: string | null }

type CommitResult = { done: PendingFile[]; error: Error | null }

const TEMP_SUFFIX = '.lead-flow-tmp'
const WRITE_FAILED_CODE = 'ESCRITURA_FALLIDA'

const tempPath = (file: PendingFile) => `${file.absolute}${TEMP_SUFFIX}`

const stage = async (file: PendingFile) => {
  await mkdir(dirname(file.absolute), { recursive: true })
  await writeFile(tempPath(file), file.contenido, 'utf8')
}

const removeTemp = (file: PendingFile) => rm(tempPath(file), { force: true })

const restore = async (file: PendingFile) => {
  if (file.previous === null) return rm(file.absolute, { force: true })
  return writeFile(file.absolute, file.previous, 'utf8')
}

const commitAll = async (pending: PendingFile[], done: PendingFile[]): Promise<CommitResult> => {
  const [next, ...rest] = pending
  if (!next) return { done, error: null }
  const { error } = await attempt(rename(tempPath(next), next.absolute))
  if (error) return { done, error }
  return commitAll(rest, [...done, next])
}

const listFailedRestores = (done: PendingFile[], results: PromiseSettledResult<unknown>[]) =>
  done.filter((_file, index) => results[index]?.status === 'rejected').map((file) => file.absolute)

const describeRestoreFailure = (failed: string[]) => {
  if (failed.length === 0) return 'Se han dejado los archivos como estaban.'
  return `No se ha podido restaurar: ${failed.join(', ')}. Revisa esos archivos con git.`
}

const abort = async (files: PendingFile[], done: PendingFile[], cause: Error) => {
  const restored = await Promise.allSettled(done.map(restore))
  await Promise.allSettled(files.map(removeTemp))
  const failed = listFailedRestores(done, restored)
  throw new LeadFlowError(
    WRITE_FAILED_CODE,
    `No se han podido escribir los archivos generados (${cause.message}). ${describeRestoreFailure(failed)} Pueden haber quedado carpetas vacías.`
  )
}

const firstRejection = (results: PromiseSettledResult<unknown>[]) =>
  results.find((result): result is PromiseRejectedResult => result.status === 'rejected')

// Todo o nada: primero temporales junto al destino, después renombrados; si algo falla se deshace lo ya renombrado.
export const writeAtomically = async (files: PendingFile[]) => {
  // allSettled: ninguna preparación sigue en vuelo cuando se limpia, o recrearía su temporal.
  const rejected = firstRejection(await Promise.allSettled(files.map(stage)))
  if (rejected) return abort(files, [], rejected.reason as Error)
  const { done, error } = await commitAll(files, [])
  if (error) return abort(files, done, error)
}
