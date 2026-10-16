import type { LocalDate, StreakOverview } from '@tuktuk/core'

/**
 * The "how did yesterday go" card: once a day, until dismissed, and not after a rest day
 * (there's nothing to sum up when yesterday had no tasks).
 */
export function shouldShowYesterdaySummary(
  streak: StreakOverview | null,
  dismissedOn: LocalDate | null,
  today: LocalDate,
): boolean {
  return streak !== null && streak.yesterday.result !== 'rest' && dismissedOn !== today
}
