import { describe, expect, it } from 'vitest'
import {
  formatTimeOfDay,
  isWithinRange,
  parseTimeOfDay,
  timeOfDay,
  toTimeOfDay,
} from './time-of-day'
import { DomainError } from './shared/domain-error'

describe('timeOfDay / parse / format', () => {
  it('round-trips HH:MM', () => {
    expect(formatTimeOfDay(parseTimeOfDay('09:05'))).toBe('09:05')
    expect(formatTimeOfDay(parseTimeOfDay('7:30'))).toBe('07:30')
    expect(formatTimeOfDay(timeOfDay(24))).toBe('24:00')
  })

  it.each(['24:01', '12:60', '-1:00', 'noon', '12'])('rejects %j', (value) => {
    expect(() => parseTimeOfDay(value)).toThrow(DomainError)
  })
})

describe('toTimeOfDay', () => {
  it('uses the given timezone', () => {
    const instant = new Date('2026-10-14T22:30:00Z')
    expect(formatTimeOfDay(toTimeOfDay(instant, 'UTC'))).toBe('22:30')
    expect(formatTimeOfDay(toTimeOfDay(instant, 'Europe/Moscow'))).toBe('01:30')
  })
})

describe('isWithinRange', () => {
  const t = parseTimeOfDay

  it('handles a same-day range as [start, end)', () => {
    const range = { start: t('09:00'), end: t('18:00') }
    expect(isWithinRange(t('09:00'), range)).toBe(true)
    expect(isWithinRange(t('17:59'), range)).toBe(true)
    expect(isWithinRange(t('18:00'), range)).toBe(false)
    expect(isWithinRange(t('08:59'), range)).toBe(false)
  })

  it('handles a range wrapping over midnight', () => {
    const quiet = { start: t('23:30'), end: t('08:00') }
    expect(isWithinRange(t('23:30'), quiet)).toBe(true)
    expect(isWithinRange(t('00:00'), quiet)).toBe(true)
    expect(isWithinRange(t('07:59'), quiet)).toBe(true)
    expect(isWithinRange(t('08:00'), quiet)).toBe(false)
    expect(isWithinRange(t('12:00'), quiet)).toBe(false)
  })
})
