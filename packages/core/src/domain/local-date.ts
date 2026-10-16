import type { Brand } from './shared/brand'
import { DomainError } from './shared/domain-error'

/** A calendar date without time or timezone, `YYYY-MM-DD`. */
export type LocalDate = Brand<string, 'LocalDate'>

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

const LOCAL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseLocalDate(value: string): LocalDate {
  const match = LOCAL_DATE_RE.exec(value)
  if (!match) throw new DomainError('localDate.invalid')
  const [, y, m, d] = match.map(Number) as [number, number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d))
  // Rejects overflow like 2026-02-30, which Date would silently roll over.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    throw new DomainError('localDate.invalid')
  }
  return value as LocalDate
}

/** The calendar date of `instant` as seen in `timeZone` (IANA name, e.g. `Europe/Moscow`). */
export function toLocalDate(instant: Date, timeZone: string): LocalDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}` as LocalDate
}

const toUtcDate = (date: LocalDate) => new Date(`${date}T00:00:00Z`)

export function weekdayOf(date: LocalDate): Weekday {
  const day = toUtcDate(date).getUTCDay() // 0 = Sunday
  return (day === 0 ? 7 : day) as Weekday
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const utc = toUtcDate(date)
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().slice(0, 10) as LocalDate
}

/** `count` consecutive dates starting with `start`. */
export function datesFrom(start: LocalDate, count: number): LocalDate[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i))
}
