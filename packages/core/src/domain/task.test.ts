import { describe, expect, it } from 'vitest'
import {
  TASK_TITLE_MAX_LENGTH,
  archiveTask,
  createTask,
  isScheduledOn,
  renameTask,
  type NewTaskInput,
  type TaskId,
} from './task'
import type { LocalDate } from './local-date'
import { DomainError } from './shared/domain-error'

const d = (s: string) => s as LocalDate
const deps = {
  id: 'task-1' as TaskId,
  now: new Date('2026-10-14T09:00:00Z'),
  today: d('2026-10-12'),
}
const make = (input: Partial<NewTaskInput> = {}) =>
  createTask(
    { title: 'Call mom', schedule: { kind: 'once', date: d('2026-10-14') }, ...input },
    deps,
  )

const expectDomainError = (fn: () => unknown, code: string) => {
  expect(fn).toThrow(DomainError)
  expect(fn).toThrow(code)
}

describe('createTask', () => {
  it('creates a required task by default', () => {
    expect(make()).toEqual({
      id: 'task-1',
      title: 'Call mom',
      schedule: { kind: 'once', date: '2026-10-14' },
      required: true,
      createdAt: deps.now,
      activeFrom: '2026-10-12',
    })
  })

  it('normalizes whitespace in the title', () => {
    expect(make({ title: '  Call   mom \n' }).title).toBe('Call mom')
  })

  it('rejects empty and too long titles', () => {
    expectDomainError(() => make({ title: '   ' }), 'task.titleEmpty')
    expectDomainError(
      () => make({ title: 'x'.repeat(TASK_TITLE_MAX_LENGTH + 1) }),
      'task.titleTooLong',
    )
  })

  it('dedupes and sorts weekdays of a habit', () => {
    const task = make({ schedule: { kind: 'weekly', weekdays: [5, 1, 3, 1] } })
    expect(task.schedule).toEqual({ kind: 'weekly', weekdays: [1, 3, 5] })
  })

  it('rejects habits without weekdays or with invalid ones', () => {
    expectDomainError(() => make({ schedule: { kind: 'weekly', weekdays: [] } }), 'task.noWeekdays')
    expectDomainError(
      // @ts-expect-error — runtime guard against bad persisted data
      () => make({ schedule: { kind: 'weekly', weekdays: [0] } }),
      'task.invalidWeekday',
    )
  })

  it('rejects an invalid date for a one-off task', () => {
    expectDomainError(
      () => make({ schedule: { kind: 'once', date: d('2026-02-30') } }),
      'localDate.invalid',
    )
  })
})

describe('isScheduledOn', () => {
  it('matches a one-off task only on its date', () => {
    const task = make()
    expect(isScheduledOn(task, d('2026-10-14'))).toBe(true)
    expect(isScheduledOn(task, d('2026-10-15'))).toBe(false)
  })

  it('matches a habit on its weekdays', () => {
    // Mon, Wed, Fri
    const task = make({ schedule: { kind: 'weekly', weekdays: [1, 3, 5] } })
    expect(isScheduledOn(task, d('2026-10-12'))).toBe(true) // Mon
    expect(isScheduledOn(task, d('2026-10-13'))).toBe(false) // Tue
    expect(isScheduledOn(task, d('2026-10-14'))).toBe(true) // Wed
  })

  it('matches only within [activeFrom, archivedOn)', () => {
    // Every day, active since Mon 2026-10-12.
    const habit = make({ schedule: { kind: 'weekly', weekdays: [1, 2, 3, 4, 5, 6, 7] } })
    expect(isScheduledOn(habit, d('2026-10-11'))).toBe(false) // before it existed

    const archived = archiveTask(habit, d('2026-10-14'))
    expect(isScheduledOn(archived, d('2026-10-13'))).toBe(true) // history is kept
    expect(isScheduledOn(archived, d('2026-10-14'))).toBe(false) // gone from the archive day
    expect(isScheduledOn(archived, d('2026-10-20'))).toBe(false)
  })
})

describe('renameTask / archiveTask', () => {
  it('renames with the same validation', () => {
    expect(renameTask(make(), '  Buy milk ').title).toBe('Buy milk')
    expectDomainError(() => renameTask(make(), ''), 'task.titleEmpty')
  })

  it('keeps the first archive date', () => {
    const archived = archiveTask(make(), d('2026-10-14'))
    expect(archiveTask(archived, d('2026-10-20')).archivedOn).toBe('2026-10-14')
  })
})
