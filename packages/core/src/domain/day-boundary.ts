import { MINUTES_IN_DAY, toTimeOfDay } from './time-of-day'

const MINUTE_MS = 60_000

/**
 * Approximate time until the next local midnight in `timeZone`.
 * May be off by an hour on DST transition days — use it only to decide *when to check*;
 * whether the day actually changed is decided by comparing `toLocalDate` results.
 */
export function msUntilNextLocalDay(now: Date, timeZone: string): number {
  const minutesLeft = MINUTES_IN_DAY - toTimeOfDay(now, timeZone)
  const intoCurrentMinute = now.getUTCSeconds() * 1000 + now.getUTCMilliseconds()
  return minutesLeft * MINUTE_MS - intoCurrentMinute
}
