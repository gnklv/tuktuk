import type { LocalDate } from '../../domain/local-date'

/** The last reminder of a day, so a reload or a second tab doesn't nudge again right away. */
export interface NudgeLogEntry {
  readonly date: LocalDate
  readonly at: Date
  readonly messageId: string
}

export interface NudgeLogRepository {
  getLast(): Promise<NudgeLogEntry | null>
  save(entry: NudgeLogEntry): Promise<void>
}
