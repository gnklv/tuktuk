import { describe, expect, it } from 'vitest'
import { buildDayOverview } from './day-overview'
import { createTask, type TaskId, type TaskSchedule } from './task'
import type { LocalDate } from './local-date'

const d = (s: string) => s as LocalDate
const today = d('2026-10-14') // Wednesday

const task = (id: string, schedule: TaskSchedule, createdAt: string) =>
  createTask({ title: id, schedule }, { id: id as TaskId, now: new Date(createdAt) })

describe('buildDayOverview', () => {
  const habit = task('habit', { kind: 'weekly', weekdays: [3] }, '2026-10-01T10:00:00Z')
  const todayTask = task('today', { kind: 'once', date: today }, '2026-10-14T08:00:00Z')
  const tomorrowTask = task(
    'tomorrow',
    { kind: 'once', date: d('2026-10-15') },
    '2026-10-14T09:00:00Z',
  )
  const tasks = [todayTask, tomorrowTask, habit]

  it('includes only tasks scheduled on the day, in creation order', () => {
    const overview = buildDayOverview(today, tasks, [])
    expect(overview.items.map((i) => i.task.id)).toEqual(['habit', 'today'])
    expect(overview.doneCount).toBe(0)
  })

  it('marks tasks completed on that day', () => {
    const at = new Date('2026-10-14T12:00:00Z')
    const overview = buildDayOverview(today, tasks, [
      { taskId: 'today' as TaskId, date: today, completedAt: at },
      // Done on another day — must not count today.
      { taskId: 'habit' as TaskId, date: d('2026-10-07'), completedAt: at },
    ])
    expect(overview.items.map((i) => i.completedAt)).toEqual([null, at])
    expect(overview.doneCount).toBe(1)
  })
})
