// Public API of @tuktuk/core: domain entities, rules and application use cases.
// Must stay framework-agnostic: no Vue, no browser or Node APIs.

// Domain
export { DomainError } from './domain/shared/domain-error'
export type { DomainErrorCode } from './domain/shared/domain-error'
export type { Brand } from './domain/shared/brand'
export { LOCALES, DEFAULT_LOCALE, isLocale, resolveLocale } from './domain/locale'
export type { Locale } from './domain/locale'
export { parseLocalDate, toLocalDate, weekdayOf, addDays } from './domain/local-date'
export {
  PRESSURE_LEVELS,
  DEFAULT_DAY_START,
  computePressure,
  pressureLevel,
  nudgeIntervalMinutes,
  nextNudgeAt,
  dayStart,
} from './domain/pressure'
export type { PressureLevel, PressureInput, DayPressure, NextNudgeInput } from './domain/pressure'
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
export { composeNudge, nudgeMood } from './domain/nudge-messages'
export type { NudgeCopy, NudgeMessage, NudgeMood, ComposeNudgeInput } from './domain/nudge-messages'
export { buildDayOverview } from './domain/day-overview'
export type { DayItem, DayOverview } from './domain/day-overview'
export { STREAK_LOOKBACK_DAYS, computeStreak, dayResult } from './domain/streak'
export type { DayResult, Streak } from './domain/streak'
export { THEMES, createDefaultSettings, changeSettings, validateSettings } from './domain/settings'
export type { Settings, Theme } from './domain/settings'

// Application ports
export type { Clock } from './application/ports/clock'
export type { IdGenerator } from './application/ports/id-generator'
export type { TaskRepository } from './application/ports/task-repository'
export type { CompletionRepository } from './application/ports/completion-repository'
export type { SettingsRepository } from './application/ports/settings-repository'
export type { Notifier } from './application/ports/notifier'
export type { NudgeLogRepository, NudgeLogEntry } from './application/ports/nudge-log-repository'

// Application: push protocol shared by the server and the Service Worker
export { parsePushPayload } from './application/push-payload'
export type { PushPayload } from './application/push-payload'
export { SNAPSHOT_DAYS, parseReminderSnapshot, dayCountsOn } from './application/reminder-snapshot'
export type { ReminderSnapshot, ReminderSettings, DayCounts } from './application/reminder-snapshot'

// Application use cases
export { makeAddTask } from './application/use-cases/add-task'
export { makeArchiveTask } from './application/use-cases/archive-task'
export { makeToggleCompletion } from './application/use-cases/toggle-completion'
export { makeGetDayOverview } from './application/use-cases/get-day-overview'
export { makeGetSettings, makeUpdateSettings } from './application/use-cases/settings'
export type { SettingsEnvironment } from './application/use-cases/settings'
export { makeCheckNudge } from './application/use-cases/check-nudge'
export { makeGetReminderSnapshot } from './application/use-cases/get-reminder-snapshot'
export { makeGetPendingTitles } from './application/use-cases/get-pending-titles'
export { makeGetStreak } from './application/use-cases/get-streak'
export type { StreakOverview } from './application/use-cases/get-streak'
export type { PendingTitles } from './application/use-cases/get-pending-titles'
export type { CheckNudgeInput, CheckNudgeResult } from './application/use-cases/check-nudge'
