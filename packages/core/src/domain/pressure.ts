import type { Settings } from './settings'
import {
  MINUTES_IN_DAY,
  isWithinRange,
  timeOfDay,
  toTimeOfDay,
  type TimeOfDay,
} from './time-of-day'

/**
 * Pressure: how much the day "burns", 0…1. Drives the UI color, the mascot's mood,
 * the tone of reminders and how often they come.
 *
 *   pressure = timeCurve(t) × workload
 *   t         = share of the active day elapsed, from day start (end of quiet hours) to deadline
 *   timeCurve = t²  — calm in the morning, steep towards the deadline
 *   workload  = 0.6 + 0.4 × pendingShare, or 0 when nothing is pending
 */

export const PRESSURE_LEVELS = ['calm', 'nudging', 'insistent', 'annoyed', 'panic'] as const
export type PressureLevel = (typeof PRESSURE_LEVELS)[number]

/** Day start when quiet hours are off. */
export const DEFAULT_DAY_START = timeOfDay(8)

/** Even a single pending task keeps at least this share of the time pressure. */
const MIN_WORKLOAD = 0.6

export interface PressureInput {
  now: Date
  settings: Settings
  /** Tasks of the day still not done. */
  pending: number
  /** All tasks of the day. */
  total: number
}

export interface DayPressure {
  /** 0…1 */
  readonly value: number
  readonly level: PressureLevel
  /** Share of the active day (day start → deadline) already elapsed, 0…1. */
  readonly elapsed: number
  /** Minutes until the deadline; 0 once it has passed. */
  readonly minutesLeft: number
  readonly overdue: boolean
}

export function dayStart(settings: Settings): TimeOfDay {
  return settings.quietHours?.end ?? DEFAULT_DAY_START
}

export function computePressure({ now, settings, pending, total }: PressureInput): DayPressure {
  const time = toTimeOfDay(now, settings.timeZone)
  const deadline = settings.dayDeadline
  // A deadline before the day start (only possible without quiet hours) counts from midnight.
  const start = dayStart(settings) < deadline ? dayStart(settings) : 0
  const t = clamp01((time - start) / (deadline - start))
  const rest = {
    elapsed: round3(t),
    minutesLeft: Math.max(0, deadline - time),
    overdue: time >= deadline,
  }

  if (pending <= 0 || total <= 0) return { value: 0, level: 'calm', ...rest }

  const workload = MIN_WORKLOAD + (1 - MIN_WORKLOAD) * clamp01(pending / total)
  const value = round3(t * t * workload)
  return { value, level: pressureLevel(value), ...rest }
}

export function pressureLevel(value: number): PressureLevel {
  const index = Math.min(PRESSURE_LEVELS.length - 1, Math.floor(clamp01(value) * 5))
  return PRESSURE_LEVELS[index]!
}

const MIN_NUDGE_INTERVAL = 10
const MAX_NUDGE_INTERVAL = 180

/** Minutes between reminders: 3 h when calm → 10 min in panic. */
export function nudgeIntervalMinutes(pressureValue: number): number {
  const calm = 1 - clamp01(pressureValue)
  return Math.round(MIN_NUDGE_INTERVAL + (MAX_NUDGE_INTERVAL - MIN_NUDGE_INTERVAL) * calm * calm)
}

export interface NextNudgeInput extends PressureInput {
  /** When the last reminder was sent today; `null` if none yet. */
  lastNudgeAt: Date | null
}

/**
 * When the next reminder is due. Never `null` while something is pending — during quiet hours
 * (or if the next reminder would land in them) it's the morning, so a scheduler always knows
 * when to wake up. The result may be in the past, which means "send now".
 */
export function nextNudgeAt(input: NextNudgeInput): Date | null {
  const { now, settings, pending, lastNudgeAt } = input
  if (pending <= 0) return null

  const time = toTimeOfDay(now, settings.timeZone)
  const quiet = settings.quietHours
  const at = (target: TimeOfDay) =>
    addMinutes(now, (target - time + MINUTES_IN_DAY) % MINUTES_IN_DAY)

  if (quiet && isWithinRange(time, quiet)) return at(quiet.end)
  if (!quiet && time < DEFAULT_DAY_START) return at(DEFAULT_DAY_START)
  if (!lastNudgeAt) return now

  const due = addMinutes(lastNudgeAt, nudgeIntervalMinutes(computePressure(input).value))
  if (quiet && due >= at(quiet.start)) return at(quiet.end)
  return due
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const round3 = (x: number) => Math.round(x * 1000) / 1000

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000)
