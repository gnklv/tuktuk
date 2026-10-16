import { describe, expect, it } from 'vitest'
import { computeStreak, dayResult } from './streak'
import { createTask, type Task, type TaskId, type TaskSchedule } from './task'
import { addDays, type LocalDate } from './local-date'
import type { Completion } from './completion'

const d = (s: string) => s as LocalDate
const today = d('2026-10-17') // Saturday

let n = 0
const task = (
  schedule: TaskSchedule,
  activeFrom = '2026-10-01',
  patch: Partial<Task> = {},
): Task => ({
  ...createTask(
    { title: `t${++n}`, schedule },
    { id: `t${n}` as TaskId, now: new Date('2026-10-01T00:00:00Z'), today: d(activeFrom) },
  ),
  ...patch,
})
const everyDay = (from?: string) => task({ kind: 'weekly', weekdays: [1, 2, 3, 4, 5, 6, 7] }, from)
const weekdays = (from?: string) => task({ kind: 'weekly', weekdays: [1, 2, 3, 4, 5] }, from)
const done = (t: Task, ...dates: string[]): Completion[] =>
  dates.map((date) => ({ taskId: t.id, date: d(date), completedAt: new Date(`${date}T12:00:00Z`) }))
/** `count` consecutive days ending at `end` (inclusive). */
const daysEnding = (end: string, count: number) =>
  Array.from({ length: count }, (_, i) => addDays(d(end), -i))

describe('dayResult', () => {
  it('is rest without required tasks, done when all are done, missed otherwise', () => {
    const a = everyDay()
    const b = everyDay()
    expect(dayResult(today, [], [])).toBe('rest')
    expect(dayResult(today, [a, b], done(a, today))).toBe('missed')
    expect(dayResult(today, [a, b], [...done(a, today), ...done(b, today)])).toBe('done')
  })

  it('ignores optional tasks', () => {
    const optional = everyDay()
    expect(dayResult(today, [{ ...optional, required: false }], [])).toBe('rest')
  })
})

describe('computeStreak', () => {
  it('counts consecutive done days up to yesterday while today is in progress', () => {
    const habit = everyDay()
    const completions = done(habit, ...daysEnding('2026-10-16', 5))
    expect(computeStreak(today, [habit], completions)).toEqual({
      current: 5,
      best: 5,
      todayDone: false,
      atRisk: true,
    })
  })

  it('includes today once it is done', () => {
    const habit = everyDay()
    const completions = done(habit, ...daysEnding('2026-10-17', 6))
    expect(computeStreak(today, [habit], completions)).toMatchObject({
      current: 6,
      todayDone: true,
      atRisk: false,
    })
  })

  it('a missed day breaks the streak, best remembers the longer one', () => {
    const habit = everyDay()
    const completions = [
      ...done(habit, ...daysEnding('2026-10-10', 7)), // Oct 4–10
      // Oct 11 missed
      ...done(habit, ...daysEnding('2026-10-16', 5)), // Oct 12–16
    ]
    expect(computeStreak(today, [habit], completions)).toMatchObject({ current: 5, best: 7 })
  })

  it('rest days (no tasks, e.g. weekends) neither break nor extend the streak', () => {
    const habit = weekdays()
    // Mon Oct 12 – Fri Oct 16 done; today is Saturday — rest
    const completions = done(habit, ...daysEnding('2026-10-16', 5))
    expect(computeStreak(today, [habit], completions)).toEqual({
      current: 5,
      best: 5,
      todayDone: false,
      atRisk: false,
    })
    // Next Monday, after a rest weekend
    const monday = d('2026-10-19')
    expect(computeStreak(monday, [habit], completions).current).toBe(5)
  })

  it('a new habit does not break the past, an archived one does not haunt the future', () => {
    const old = everyDay('2026-10-10')
    const fresh = everyDay('2026-10-17') // created today
    const completions = done(old, ...daysEnding('2026-10-16', 7))
    expect(computeStreak(today, [old, fresh], completions).current).toBe(7)

    // Lived Oct 1–9, never done: those days are missed, but the streak since Oct 10 is intact.
    const archived = { ...everyDay('2026-10-01'), archivedOn: d('2026-10-10') }
    expect(computeStreak(today, [old, archived], completions).current).toBe(7)
    // Archived later, not done on Oct 10–11 while it still existed: those days are missed.
    const archivedLate = { ...everyDay('2026-10-01'), archivedOn: d('2026-10-12') }
    expect(computeStreak(today, [old, archivedLate], completions).current).toBe(5)
  })

  it('is zero without any tasks or completions', () => {
    expect(computeStreak(today, [], [])).toEqual({
      current: 0,
      best: 0,
      todayDone: false,
      atRisk: false,
    })
    expect(computeStreak(today, [everyDay()], [])).toMatchObject({ current: 0, atRisk: false })
  })
})
