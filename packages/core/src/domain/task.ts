import type { Brand } from './shared/brand'
import { DomainError } from './shared/domain-error'
import { parseLocalDate, weekdayOf, type LocalDate, type Weekday } from './local-date'

export type TaskId = Brand<string, 'TaskId'>

export const TASK_TITLE_MAX_LENGTH = 200

export type TaskSchedule =
  /** A one-off task for a specific day. */
  | { kind: 'once'; date: LocalDate }
  /** A habit repeating on given weekdays. */
  | { kind: 'weekly'; weekdays: readonly Weekday[] }

export interface Task {
  readonly id: TaskId
  readonly title: string
  readonly schedule: TaskSchedule
  /** Required tasks count towards the streak; optional ones only give XP. */
  readonly required: boolean
  readonly createdAt: Date
  /** First day the task exists. Days before it are not affected (e.g. a new habit doesn't break past streaks). */
  readonly activeFrom: LocalDate
  /** Day the task was removed. It no longer appears from this day on, but stays in history. */
  readonly archivedOn?: LocalDate
}

export interface NewTaskInput {
  title: string
  schedule: TaskSchedule
  required?: boolean
}

export function createTask(
  input: NewTaskInput,
  deps: { id: TaskId; now: Date; today: LocalDate },
): Task {
  return {
    id: deps.id,
    title: normalizeTitle(input.title),
    schedule: normalizeSchedule(input.schedule),
    required: input.required ?? true,
    createdAt: deps.now,
    activeFrom: deps.today,
  }
}

export function renameTask(task: Task, title: string): Task {
  return { ...task, title: normalizeTitle(title) }
}

export function archiveTask(task: Task, today: LocalDate): Task {
  return task.archivedOn ? task : { ...task, archivedOn: today }
}

export function isScheduledOn(task: Task, date: LocalDate): boolean {
  // ISO dates compare correctly as strings.
  if (date < task.activeFrom) return false
  if (task.archivedOn && date >= task.archivedOn) return false
  switch (task.schedule.kind) {
    case 'once':
      return task.schedule.date === date
    case 'weekly':
      return task.schedule.weekdays.includes(weekdayOf(date))
  }
}

function normalizeTitle(title: string): string {
  const trimmed = title.trim().replace(/\s+/g, ' ')
  if (trimmed === '') throw new DomainError('task.titleEmpty')
  if (trimmed.length > TASK_TITLE_MAX_LENGTH) throw new DomainError('task.titleTooLong')
  return trimmed
}

function normalizeSchedule(schedule: TaskSchedule): TaskSchedule {
  switch (schedule.kind) {
    case 'once':
      return { kind: 'once', date: parseLocalDate(schedule.date) }
    case 'weekly': {
      const weekdays = [...new Set(schedule.weekdays)].sort((a, b) => a - b)
      if (weekdays.length === 0) throw new DomainError('task.noWeekdays')
      if (weekdays.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) {
        throw new DomainError('task.invalidWeekday')
      }
      return { kind: 'weekly', weekdays }
    }
  }
}
