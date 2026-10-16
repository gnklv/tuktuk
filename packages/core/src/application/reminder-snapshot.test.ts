import { beforeEach, describe, expect, it } from 'vitest'
import { parseReminderSnapshot, dayCountsOn, SNAPSHOT_DAYS } from './reminder-snapshot'
import { makeGetReminderSnapshot } from './use-cases/get-reminder-snapshot'
import { makeAddTask } from './use-cases/add-task'
import { makeToggleCompletion } from './use-cases/toggle-completion'
import { createDefaultSettings } from '../domain/settings'
import type { LocalDate } from '../domain/local-date'
import {
  InMemoryCompletionRepository,
  InMemoryTaskRepository,
  fakeClock,
  sequentialIds,
} from '../testing'

const today = '2026-10-14' as LocalDate // Wednesday
const settings = {
  ...createDefaultSettings({ locale: 'ru', timeZone: 'Europe/Moscow' }),
  theme: 'dark' as const,
}

describe('getReminderSnapshot', () => {
  let taskRepo: InMemoryTaskRepository
  let completionRepo: InMemoryCompletionRepository

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository()
    completionRepo = new InMemoryCompletionRepository()
  })

  it('has counts for the coming week and no task titles or UI settings', async () => {
    const clock = fakeClock('2026-10-14T09:00:00Z')
    const add = makeAddTask({ taskRepo, ids: sequentialIds(), clock })
    const call = await add(
      { title: 'Secret: call mom', schedule: { kind: 'once', date: today } },
      today,
    )
    await add({ title: 'Secret habit', schedule: { kind: 'weekly', weekdays: [3, 4] } }, today)
    await makeToggleCompletion({ taskRepo, completionRepo, clock })(call.id, today)

    const snapshot = await makeGetReminderSnapshot({ taskRepo, completionRepo })(settings, today)

    expect(snapshot.days).toHaveLength(SNAPSHOT_DAYS)
    expect(snapshot.days.slice(0, 3)).toEqual([
      { date: '2026-10-14', total: 2, pending: 1 }, // Wed: call (done) + habit
      { date: '2026-10-15', total: 1, pending: 1 }, // Thu: habit
      { date: '2026-10-16', total: 0, pending: 0 }, // Fri: nothing
    ])
    const json = JSON.stringify(snapshot)
    expect(json).not.toContain('Secret')
    expect(json).not.toContain('theme')
  })
})

describe('parseReminderSnapshot', () => {
  const valid = {
    settings: {
      locale: 'ru',
      timeZone: 'Europe/Moscow',
      dayDeadline: 1380,
      quietHours: { start: 1410, end: 480 },
    },
    days: [
      { date: '2026-10-14', total: 2, pending: 1 },
      { date: '2026-10-15', total: 1, pending: 1 },
    ],
  }

  it('accepts a valid snapshot and finds a day', () => {
    const snapshot = parseReminderSnapshot(valid)
    expect(snapshot).toEqual(valid)
    expect(dayCountsOn(snapshot!, '2026-10-15' as LocalDate)).toEqual({
      date: '2026-10-15',
      total: 1,
      pending: 1,
    })
    expect(dayCountsOn(snapshot!, '2026-10-20' as LocalDate)).toBeNull()
  })

  it('accepts quiet hours turned off', () => {
    expect(
      parseReminderSnapshot({ ...valid, settings: { ...valid.settings, quietHours: null } }),
    ).not.toBeNull()
  })

  it.each([
    ['garbage', 'nope'],
    ['unknown locale', { ...valid, settings: { ...valid.settings, locale: 'de' } }],
    ['unknown timezone', { ...valid, settings: { ...valid.settings, timeZone: 'Mars/Olympus' } }],
    ['deadline in quiet hours', { ...valid, settings: { ...valid.settings, dayDeadline: 1420 } }],
    ['bad time', { ...valid, settings: { ...valid.settings, dayDeadline: 2000 } }],
    ['pending > total', { ...valid, days: [{ date: '2026-10-14', total: 1, pending: 2 }] }],
    ['negative count', { ...valid, days: [{ date: '2026-10-14', total: -1, pending: 0 }] }],
    ['bad date', { ...valid, days: [{ date: '2026-02-30', total: 1, pending: 1 }] }],
    ['duplicate dates', { ...valid, days: [valid.days[0], valid.days[0]] }],
    [
      'too many days',
      {
        ...valid,
        days: Array.from({ length: 15 }, (_, i) => ({
          date: `2026-11-${String(i + 1).padStart(2, '0')}`,
          total: 0,
          pending: 0,
        })),
      },
    ],
  ])('rejects %s', (_, data) => {
    expect(parseReminderSnapshot(data)).toBeNull()
  })
})
