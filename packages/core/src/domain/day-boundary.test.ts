import { describe, expect, it } from 'vitest'
import { msUntilNextLocalDay } from './day-boundary'

const HOUR = 3_600_000

describe('msUntilNextLocalDay', () => {
  it('counts down to midnight in the given timezone', () => {
    // 20:00 UTC = 23:00 in Moscow (UTC+3), 16:00 in New York (UTC-4)
    const now = new Date('2026-10-14T20:00:00Z')
    expect(msUntilNextLocalDay(now, 'Europe/Moscow')).toBe(1 * HOUR)
    expect(msUntilNextLocalDay(now, 'America/New_York')).toBe(8 * HOUR)
  })

  it('accounts for seconds and milliseconds', () => {
    const now = new Date('2026-10-14T23:59:30.250Z')
    expect(msUntilNextLocalDay(now, 'UTC')).toBe(29_750)
  })

  it('is a full day right at midnight', () => {
    expect(msUntilNextLocalDay(new Date('2026-10-15T00:00:00Z'), 'UTC')).toBe(24 * HOUR)
  })
})
