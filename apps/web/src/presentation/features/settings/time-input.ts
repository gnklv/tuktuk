import { MINUTES_IN_DAY, formatTimeOfDay, parseTimeOfDay, type TimeOfDay } from '@tuktuk/core'

// <input type="time"> has no 24:00, so the end-of-day deadline is shown as 00:00.

export const deadlineToInput = (time: TimeOfDay): string =>
  formatTimeOfDay((time % MINUTES_IN_DAY) as TimeOfDay)

export const deadlineFromInput = (value: string): TimeOfDay => {
  const time = parseTimeOfDay(value)
  return time === 0 ? (MINUTES_IN_DAY as TimeOfDay) : time
}

export const timeToInput = formatTimeOfDay
export const timeFromInput = parseTimeOfDay
