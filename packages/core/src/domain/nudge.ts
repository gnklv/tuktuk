import type { Locale } from './locale'
import type { DayPressure, PressureLevel } from './pressure'

/**
 * What a reminder says is decided here: the mood, which pending task to mention, no repeats.
 * How it's worded lives in `@tuktuk/i18n`, injected as `NudgeCopy`.
 */

export type NudgeMood = PressureLevel | 'overdue'

/** Reminder wording for a locale. Templates use `{task}` and `{time}` placeholders. */
export interface NudgeCopy {
  title(locale: Locale, mood: NudgeMood): string
  variants(locale: Locale, mood: NudgeMood): readonly string[]
  duration(locale: Locale, minutes: number): string
}

export interface NudgeMessage {
  /** Stable id (`mood:index`) to avoid repeating the same text twice in a row. */
  readonly id: string
  readonly title: string
  readonly body: string
}

export interface ComposeNudgeInput {
  locale: Locale
  pressure: DayPressure
  /** Titles of tasks still pending; one is mentioned in the message. */
  pendingTitles: readonly string[]
  /** Id of the previous message, to avoid repeating it. */
  previousId: string | null
  /** 0…1, injected for deterministic tests. */
  random: () => number
}

export function nudgeMood(pressure: DayPressure): NudgeMood {
  return pressure.overdue ? 'overdue' : pressure.level
}

export function composeNudge(copy: NudgeCopy, input: ComposeNudgeInput): NudgeMessage {
  const { locale, pressure, pendingTitles, previousId, random } = input
  const mood = nudgeMood(pressure)
  const variants = copy.variants(locale, mood)

  const candidates = variants.map((_, i) => i).filter((i) => `${mood}:${i}` !== previousId)
  const index = candidates[Math.floor(random() * candidates.length)] ?? 0
  const task = pendingTitles[Math.floor(random() * pendingTitles.length)] ?? ''

  const body = (variants[index] ?? '')
    .replaceAll('{task}', task)
    .replaceAll('{time}', copy.duration(locale, pressure.minutesLeft))
  return { id: `${mood}:${index}`, title: copy.title(locale, mood), body }
}
