import { describe, expect, it } from 'vitest'
import {
  computePressure,
  nextNudgeAt,
  nudgeIntervalMinutes,
  pressureLevel,
  type PressureInput,
} from './pressure'
import { createDefaultSettings, type Settings } from './settings'
import { parseTimeOfDay } from './time-of-day'

// UTC keeps wall-clock times readable. Defaults: deadline 23:00, quiet hours 23:30–08:00,
// so the active day is 08:00–23:00 (900 minutes).
const settings: Settings = createDefaultSettings({ locale: 'en', timeZone: 'UTC' })
const at = (hhmm: string, date = '2026-10-14') => new Date(`${date}T${hhmm}:00Z`)

const pressureAt = (hhmm: string, input: Partial<PressureInput> = {}) =>
  computePressure({ now: at(hhmm), settings, pending: 3, total: 3, ...input })

describe('computePressure', () => {
  it('is zero before and at the start of the day', () => {
    expect(pressureAt('06:00').value).toBe(0)
    expect(pressureAt('08:00').value).toBe(0)
  })

  it('grows quadratically: calm by midday, steep towards the deadline', () => {
    expect(pressureAt('15:30').value).toBe(0.25) // t = 0.5
    expect(pressureAt('22:00').value).toBeCloseTo(0.871, 3) // t ≈ 0.93
  })

  it('never decreases during the day', () => {
    let previous = 0
    for (let minutes = 0; minutes < 24 * 60; minutes += 5) {
      const hhmm = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
      const { value } = pressureAt(hhmm)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('is lower when most tasks are done, zero when all are done or there are none', () => {
    const allPending = pressureAt('22:00').value
    const onePending = pressureAt('22:00', { pending: 1, total: 5 }).value
    expect(onePending).toBeCloseTo(allPending * 0.68, 3)
    expect(pressureAt('22:00', { pending: 0, total: 5 }).value).toBe(0)
    expect(pressureAt('22:00', { pending: 0, total: 0 }).value).toBe(0)
  })

  it('reports time left and overdue state', () => {
    expect(pressureAt('19:40')).toMatchObject({ minutesLeft: 200, overdue: false })
    expect(pressureAt('15:30').elapsed).toBe(0.5)
    expect(pressureAt('23:10')).toEqual({
      value: 1,
      level: 'panic',
      elapsed: 1,
      minutesLeft: 0,
      overdue: true,
    })
  })

  it('counts from midnight when the deadline is before the default day start', () => {
    const nightOwl = { ...settings, quietHours: null, dayDeadline: parseTimeOfDay('03:00') }
    expect(pressureAt('01:30', { settings: nightOwl }).value).toBe(0.25)
  })

  it('uses the user timezone', () => {
    const moscow = { ...settings, timeZone: 'Europe/Moscow' }
    // 12:30 UTC = 15:30 in Moscow
    expect(pressureAt('12:30', { settings: moscow }).value).toBe(0.25)
  })
})

describe('pressureLevel', () => {
  it.each([
    [0, 'calm'],
    [0.19, 'calm'],
    [0.2, 'nudging'],
    [0.45, 'insistent'],
    [0.6, 'annoyed'],
    [0.8, 'panic'],
    [1, 'panic'],
  ] as const)('%d → %s', (value, level) => {
    expect(pressureLevel(value)).toBe(level)
  })
})

describe('nudgeIntervalMinutes', () => {
  it('goes from 3 hours when calm to 10 minutes in panic', () => {
    expect(nudgeIntervalMinutes(0)).toBe(180)
    expect(nudgeIntervalMinutes(0.5)).toBe(53)
    expect(nudgeIntervalMinutes(1)).toBe(10)
  })
})

describe('nextNudgeAt', () => {
  const next = (hhmm: string, lastNudgeAt: Date | null, input: Partial<PressureInput> = {}) =>
    nextNudgeAt({ now: at(hhmm), settings, pending: 3, total: 3, lastNudgeAt, ...input })

  it('is null when nothing is pending', () => {
    expect(next('12:00', null, { pending: 0 })).toBeNull()
  })

  it('waits for the end of quiet hours', () => {
    expect(next('07:00', null)).toEqual(at('08:00'))
    expect(next('23:45', null)).toEqual(at('08:00', '2026-10-15'))
  })

  it('without quiet hours, waits for the default day start', () => {
    expect(next('06:00', null, { settings: { ...settings, quietHours: null } })).toEqual(
      at('08:00'),
    )
  })

  it('nudges right away if there was no reminder yet today', () => {
    expect(next('09:00', null)).toEqual(at('09:00'))
  })

  it('spaces reminders by the current pressure', () => {
    // last at 11:00 → pressure then 0.04 → interval 167 min
    expect(next('12:00', at('11:00'))).toEqual(at('13:47'))
    // the answer doesn't depend on when we ask
    expect(next('13:30', at('11:00'))).toEqual(at('13:47'))
    // last at 21:55 → pressure then ≈ 0.861 → interval 13 min
    expect(next('22:00', at('21:55'))).toEqual(at('22:08'))
  })

  it('keeps nagging after the deadline, but not into quiet hours', () => {
    expect(next('23:20', at('23:15'))).toEqual(at('23:25'))
    // 23:35 would be quiet already → next morning
    expect(next('23:28', at('23:25'))).toEqual(at('08:00', '2026-10-15'))
  })
})
