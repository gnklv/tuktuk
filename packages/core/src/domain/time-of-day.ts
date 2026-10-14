import type { Brand } from './shared/brand'
import { DomainError } from './shared/domain-error'

/** Minutes since local midnight, 0…1440 (1440 = end of day, 24:00). */
export type TimeOfDay = Brand<number, 'TimeOfDay'>

export const MINUTES_IN_DAY = 1440

export function timeOfDay(hours: number, minutes = 0): TimeOfDay {
  const total = hours * 60 + minutes
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    minutes < 0 ||
    minutes > 59 ||
    total < 0 ||
    total > MINUTES_IN_DAY
  ) {
    throw new DomainError('timeOfDay.invalid')
  }
  return total as TimeOfDay
}

/** Parses `HH:MM` (24-hour). */
export function parseTimeOfDay(value: string): TimeOfDay {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) throw new DomainError('timeOfDay.invalid')
  return timeOfDay(Number(match[1]), Number(match[2]))
}

export function formatTimeOfDay(time: TimeOfDay): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(time / 60))}:${pad(time % 60)}`
}

/** Local wall-clock time of `instant` in `timeZone`. */
export function toTimeOfDay(instant: Date, timeZone: string): TimeOfDay {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value)
  return (get('hour') * 60 + get('minute')) as TimeOfDay
}

/** Half-open range `[start, end)`; wraps over midnight when `end < start` (e.g. 23:00–08:00). */
export interface TimeRange {
  start: TimeOfDay
  end: TimeOfDay
}

export function isWithinRange(time: TimeOfDay, range: TimeRange): boolean {
  const { start, end } = range
  return start <= end ? time >= start && time < end : time >= start || time < end
}
