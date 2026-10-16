import { describe, expect, it } from 'vitest'
import type { LocalDate, StreakOverview } from '@tuktuk/core'
import { shouldShowYesterdaySummary } from './yesterday-summary'

const today = '2026-10-17' as LocalDate
const yesterday = '2026-10-16' as LocalDate

const streak = (result: StreakOverview['yesterday']['result']): StreakOverview => ({
  streak: { current: 3, best: 5, todayDone: false, atRisk: true },
  yesterday: { date: yesterday, result, done: 1, total: 2 },
})

describe('shouldShowYesterdaySummary', () => {
  it('shows how yesterday went until it is dismissed today', () => {
    expect(shouldShowYesterdaySummary(streak('done'), null, today)).toBe(true)
    expect(shouldShowYesterdaySummary(streak('missed'), yesterday, today)).toBe(true)
    expect(shouldShowYesterdaySummary(streak('done'), today, today)).toBe(false)
  })

  it('has nothing to say after a rest day or before the streak is loaded', () => {
    expect(shouldShowYesterdaySummary(streak('rest'), null, today)).toBe(false)
    expect(shouldShowYesterdaySummary(null, null, today)).toBe(false)
  })
})
