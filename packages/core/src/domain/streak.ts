import type { Completion } from './completion'
import { addDays, type LocalDate } from './local-date'
import { isScheduledOn, type Task } from './task'

/**
 * Streak: consecutive days with every required task done.
 *
 * - `done`    — the day had required tasks and all of them were done: extends the streak.
 * - `missed`  — the day had required tasks and some weren't done: breaks the streak.
 * - `rest`    — no required tasks that day (a weekend without habits): neutral.
 *
 * Today is in progress: until it's done it neither extends nor breaks the streak.
 */
export type DayResult = 'done' | 'missed' | 'rest'

export interface Streak {
  /** Current streak; includes today only once today is done. */
  readonly current: number
  /** The longest streak within the looked-back history. */
  readonly best: number
  readonly todayDone: boolean
  /** Today has required tasks that aren't all done yet, and there is a streak to lose. */
  readonly atRisk: boolean
}

/** How far back history is scanned. A year keeps it fast and is plenty for "best". */
export const STREAK_LOOKBACK_DAYS = 366

export function dayResult(
  date: LocalDate,
  tasks: readonly Task[],
  completions: readonly Completion[],
): DayResult {
  const required = tasks.filter((task) => task.required && isScheduledOn(task, date))
  if (required.length === 0) return 'rest'
  const done = new Set(completions.filter((c) => c.date === date).map((c) => c.taskId))
  return required.every((task) => done.has(task.id)) ? 'done' : 'missed'
}

export function computeStreak(
  today: LocalDate,
  tasks: readonly Task[],
  completions: readonly Completion[],
): Streak {
  const earliest = tasks.reduce<LocalDate | null>(
    (min, task) => (min === null || task.activeFrom < min ? task.activeFrom : min),
    null,
  )
  const lookbackStart = addDays(today, -(STREAK_LOOKBACK_DAYS - 1))
  const from = earliest && earliest > lookbackStart ? earliest : lookbackStart

  // Chronological results up to yesterday; today is handled separately (still in progress).
  const past: DayResult[] = []
  for (let date = from; date < today; date = addDays(date, 1)) {
    past.push(earliest ? dayResult(date, tasks, completions) : 'rest')
  }
  const todayResult = dayResult(today, tasks, completions)
  const todayDone = todayResult === 'done'

  let best = 0
  let run = 0
  for (const result of todayDone ? [...past, todayResult] : past) {
    if (result === 'done') best = Math.max(best, ++run)
    else if (result === 'missed') run = 0
  }

  let current = todayDone ? 1 : 0
  for (let i = past.length - 1; i >= 0 && past[i] !== 'missed'; i--) {
    if (past[i] === 'done') current++
  }

  return { current, best, todayDone, atRisk: todayResult === 'missed' && current > 0 }
}
