import { describe, expect, it } from 'vitest'
import {
  addDays,
  datesFrom,
  parseLocalDate,
  toLocalDate,
  weekdayOf,
  type LocalDate,
} from './local-date'
import { DomainError } from './shared/domain-error'

const d = (s: string) => s as LocalDate

describe('parseLocalDate', () => {
  it('accepts valid dates', () => {
    expect(parseLocalDate('2026-10-14')).toBe('2026-10-14')
    expect(parseLocalDate('2028-02-29')).toBe('2028-02-29')
  })

  it.each(['2026-02-30', '2026-13-01', '2026-1-1', '14.10.2026', ''])('rejects %j', (value) => {
    expect(() => parseLocalDate(value)).toThrow(DomainError)
  })
})

describe('toLocalDate', () => {
  // 2026-10-14 22:30 UTC
  const instant = new Date('2026-10-14T22:30:00Z')

  it('uses the given timezone, not UTC', () => {
    expect(toLocalDate(instant, 'UTC')).toBe('2026-10-14')
    expect(toLocalDate(instant, 'Europe/Moscow')).toBe('2026-10-15') // UTC+3
    expect(toLocalDate(instant, 'America/New_York')).toBe('2026-10-14') // UTC-4
  })
})

describe('weekdayOf', () => {
  it('returns ISO weekdays, Monday = 1, Sunday = 7', () => {
    expect(weekdayOf(d('2026-10-12'))).toBe(1)
    expect(weekdayOf(d('2026-10-14'))).toBe(3)
    expect(weekdayOf(d('2026-10-18'))).toBe(7)
  })
})

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays(d('2026-10-31'), 1)).toBe('2026-11-01')
    expect(addDays(d('2026-12-31'), 1)).toBe('2027-01-01')
    expect(addDays(d('2026-03-01'), -1)).toBe('2026-02-28')
  })

  it('is not affected by DST transitions', () => {
    // Europe switches to winter time on 2026-10-25.
    expect(addDays(d('2026-10-24'), 2)).toBe('2026-10-26')
  })
})

describe('datesFrom', () => {
  it('lists consecutive dates across a month boundary', () => {
    expect(datesFrom(d('2026-10-30'), 3)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01'])
    expect(datesFrom(d('2026-10-30'), 0)).toEqual([])
  })
})
