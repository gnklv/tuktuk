// Public API of @tuktuk/core — what the web app, the push server and @tuktuk/i18n use.
// Must stay framework-agnostic: no Vue, no browser or Node APIs.
// Everything else (helpers of pressure and streak rules, internal types) stays private.

// ---------- Domain ----------

export { DomainError } from './domain/shared/domain-error'

export { LOCALES, DEFAULT_LOCALE, isLocale, resolveLocale } from './domain/locale'
export type { Locale } from './domain/locale'

export { parseLocalDate, toLocalDate } from './domain/local-date'
export type { LocalDate, Weekday } from './domain/local-date'

export { MINUTES_IN_DAY, timeOfDay, parseTimeOfDay, formatTimeOfDay } from './domain/time-of-day'
export type { TimeOfDay } from './domain/time-of-day'

export { TASK_TITLE_MAX_LENGTH, createTask, restoreTask } from './domain/task'
export type { Task, TaskId, TaskSchedule, NewTaskInput } from './domain/task'

export { restoreCompletion } from './domain/completion'
export type { Completion } from './domain/completion'

export type { DayItem, DayOverview } from './domain/day-overview'

export { THEMES, createDefaultSettings, restoreSettings } from './domain/settings'
export type { Settings, Theme } from './domain/settings'

export { PRESSURE_LEVELS, computePressure, nextNudgeAt } from './domain/pressure'
export type { PressureLevel, DayPressure } from './domain/pressure'

export { composeNudge, nudgeMood } from './domain/nudge'
export type { NudgeCopy, NudgeMessage, NudgeMood } from './domain/nudge'

export type { Streak } from './domain/streak'

// ---------- Application: ports ----------

export type { Clock } from './application/ports/clock'
export type { IdGenerator } from './application/ports/id-generator'
export type { TaskRepository } from './application/ports/task-repository'
export type { CompletionRepository } from './application/ports/completion-repository'
export type { SettingsRepository } from './application/ports/settings-repository'
export type { Notifier } from './application/ports/notifier'
export type { NudgeLogRepository, NudgeLogEntry } from './application/ports/nudge-log-repository'

// ---------- Application: protocol between the app, the server and the Service Worker ----------

export { parsePushPayload } from './application/push-payload'
export type { PushPayload } from './application/push-payload'

export { parseReminderSnapshot, dayCountsOn } from './application/reminder-snapshot'
export type { ReminderSnapshot } from './application/reminder-snapshot'

// ---------- Application: use cases ----------

export { makeAddTask } from './application/use-cases/add-task'
export { makeArchiveTask } from './application/use-cases/archive-task'
export { makeToggleCompletion } from './application/use-cases/toggle-completion'
export { makeGetDayOverview } from './application/use-cases/get-day-overview'
export { makeGetStreak } from './application/use-cases/get-streak'
export type { StreakOverview } from './application/use-cases/get-streak'
export { makeGetSettings, makeUpdateSettings } from './application/use-cases/settings'
export type { SettingsEnvironment } from './application/use-cases/settings'
export { makeCheckNudge } from './application/use-cases/check-nudge'
export type { NudgeDelivery } from './application/use-cases/check-nudge'
export { makeGetReminderSnapshot } from './application/use-cases/get-reminder-snapshot'
export { makeGetPendingTitles } from './application/use-cases/get-pending-titles'
export type { PendingTitles } from './application/use-cases/get-pending-titles'
