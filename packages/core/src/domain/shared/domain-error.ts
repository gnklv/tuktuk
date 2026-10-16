/** Every business rule violation has a stable code; the UI maps each one to a message. */
export type DomainErrorCode =
  | 'localDate.invalid'
  | 'timeOfDay.invalid'
  | 'task.titleEmpty'
  | 'task.titleTooLong'
  | 'task.noWeekdays'
  | 'task.invalidWeekday'
  | 'task.notFound'
  | 'task.notScheduled'
  | 'settings.deadlineAtDayStart'
  | 'settings.deadlineInQuietHours'
  | 'settings.quietHoursEmpty'

export class DomainError extends Error {
  constructor(readonly code: DomainErrorCode) {
    super(code)
    this.name = 'DomainError'
  }
}
