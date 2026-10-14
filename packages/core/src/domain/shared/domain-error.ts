/**
 * A violated business rule. `code` is stable and maps to a UI message
 * (e.g. `task.titleEmpty` → `errors.task.titleEmpty`).
 */
export class DomainError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'DomainError'
  }
}
