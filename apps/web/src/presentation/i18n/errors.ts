import { DomainError } from '@tuktuk/core'
import type { MessageKey } from '.'

/**
 * Message key for any thrown value. The template literal makes the compiler check
 * that every `DomainErrorCode` has a translation under `errors.*`.
 */
export function errorMessageKey(error: unknown): MessageKey {
  if (error instanceof DomainError) return `errors.${error.code}`
  console.error(error)
  return 'errors.unknown'
}
