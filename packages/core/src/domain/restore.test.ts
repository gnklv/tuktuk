import { describe, expect, it } from 'vitest'
import { restoreTask, type StoredTask } from './task'
import { restoreCompletion } from './completion'
import { createDefaultSettings, restoreSettings } from './settings'

const validTask: StoredTask = {
  id: 't1',
  title: 'Call mom',
  schedule: { kind: 'weekly', weekdays: [5, 1] },
  required: true,
  createdAt: new Date('2026-10-01T09:00:00Z'),
  activeFrom: '2026-10-01',
}

describe('restoreTask', () => {
  it('rebuilds a valid task with the same normalization as createTask', () => {
    expect(restoreTask({ ...validTask, archivedOn: '2026-10-10' })).toEqual({
      ...validTask,
      schedule: { kind: 'weekly', weekdays: [1, 5] },
      archivedOn: '2026-10-10',
    })
  })

  it.each([
    ['empty id', { id: '' }],
    ['numeric id', { id: 42 }],
    ['blank title', { title: '   ' }],
    ['unknown schedule kind', { schedule: { kind: 'monthly' } }],
    ['no schedule', { schedule: null }],
    ['weekday out of range', { schedule: { kind: 'weekly', weekdays: [0, 9] } }],
    ['weekday as string', { schedule: { kind: 'weekly', weekdays: ['1'] } }],
    ['impossible date', { schedule: { kind: 'once', date: '2026-02-30' } }],
    ['required not boolean', { required: 'yes' }],
    ['invalid createdAt', { createdAt: new Date('nope') }],
    ['invalid activeFrom', { activeFrom: 'yesterday' }],
    ['invalid archivedOn', { archivedOn: 42 }],
  ])('rejects %s', (_, patch) => {
    expect(() => restoreTask({ ...validTask, ...patch } as StoredTask)).toThrow()
  })
})

describe('restoreCompletion', () => {
  const valid = { taskId: 't1', date: '2026-10-14', completedAt: new Date('2026-10-14T12:00:00Z') }

  it('rebuilds a valid completion', () => {
    expect(restoreCompletion(valid)).toEqual(valid)
  })

  it.each([
    ['missing task id', { taskId: undefined }],
    ['bad date', { date: '14.10.2026' }],
    ['invalid completedAt', { completedAt: new Date('nope') }],
  ])('rejects %s', (_, patch) => {
    expect(() => restoreCompletion({ ...valid, ...patch })).toThrow()
  })
})

describe('restoreSettings', () => {
  const valid = createDefaultSettings({ locale: 'ru', timeZone: 'Europe/Moscow' })

  it('rebuilds valid settings', () => {
    expect(restoreSettings(JSON.parse(JSON.stringify(valid)))).toEqual(valid)
    expect(restoreSettings({ ...valid, quietHours: null }).quietHours).toBeNull()
  })

  it.each([
    ['not an object', null],
    ['unknown locale', { ...valid, locale: 'de' }],
    ['unknown timezone', { ...valid, timeZone: 'Mars/Olympus' }],
    ['unknown theme', { ...valid, theme: 'neon' }],
    ['deadline as string', { ...valid, dayDeadline: '23:00' }],
    ['deadline out of range', { ...valid, dayDeadline: 2000 }],
    ['malformed quiet hours', { ...valid, quietHours: { start: 'abc' } }],
    ['deadline inside quiet hours', { ...valid, dayDeadline: 1420 }],
  ])('rejects %s', (_, value) => {
    expect(() => restoreSettings(value)).toThrow()
  })
})
