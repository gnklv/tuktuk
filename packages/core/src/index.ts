// Public API of @tuktuk/core: domain entities, rules and application use cases.
// Must stay framework-agnostic: no Vue, no browser or Node APIs.

// Domain
export { DomainError } from './domain/shared/domain-error'
export type { DomainErrorCode } from './domain/shared/domain-error'
export type { Brand } from './domain/shared/brand'
export { LOCALES, DEFAULT_LOCALE, isLocale, resolveLocale } from './domain/locale'
export type { Locale } from './domain/locale'
export { parseLocalDate, toLocalDate, weekdayOf, addDays } from './domain/local-date'
export type { LocalDate, Weekday } from './domain/local-date'
export {
  MINUTES_IN_DAY,
  timeOfDay,
  parseTimeOfDay,
  formatTimeOfDay,
  toTimeOfDay,
  isWithinRange,
} from './domain/time-of-day'
export type { TimeOfDay, TimeRange } from './domain/time-of-day'
export {
  TASK_TITLE_MAX_LENGTH,
  createTask,
  renameTask,
  archiveTask,
  isScheduledOn,
} from './domain/task'
export type { Task, TaskId, TaskSchedule, NewTaskInput } from './domain/task'
export type { Completion } from './domain/completion'
export { buildDayOverview } from './domain/day-overview'
export type { DayItem, DayOverview } from './domain/day-overview'
export { createDefaultSettings } from './domain/settings'
export type { Settings } from './domain/settings'

// Application ports
export type { Clock } from './application/ports/clock'
export type { IdGenerator } from './application/ports/id-generator'
export type { TaskRepository } from './application/ports/task-repository'
export type { CompletionRepository } from './application/ports/completion-repository'
export type { SettingsRepository } from './application/ports/settings-repository'

// Application use cases
export { makeAddTask } from './application/use-cases/add-task'
export { makeArchiveTask } from './application/use-cases/archive-task'
export { makeToggleCompletion } from './application/use-cases/toggle-completion'
export { makeGetDayOverview } from './application/use-cases/get-day-overview'
export { makeGetSettings, makeUpdateSettings } from './application/use-cases/settings'
export type { SettingsEnvironment } from './application/use-cases/settings'
