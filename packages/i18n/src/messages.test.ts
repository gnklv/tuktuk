import { describe, expect, it } from 'vitest'
import { LOCALES, PRESSURE_LEVELS } from '@tuktuk/core'
import { formatDuration, messages, nudgeCopy } from '.'

const moods = [...PRESSURE_LEVELS, 'overdue'] as const

describe('reminder wording', () => {
  it.each(LOCALES)('%s: at least 4 variants per mood, each naming the task', (locale) => {
    for (const mood of moods) {
      const variants = nudgeCopy.variants(locale, mood)
      expect(variants.length, mood).toBeGreaterThanOrEqual(4)
      for (const text of variants) expect(text).toContain('{task}')
      expect(nudgeCopy.title(locale, mood)).not.toBe('')
    }
  })

  it.each(LOCALES)('%s: never mentions time left once the deadline has passed', (locale) => {
    for (const text of nudgeCopy.variants(locale, 'overdue')) expect(text).not.toContain('{time}')
  })

  it('has the same number of variants in every locale', () => {
    for (const mood of moods) {
      const counts = LOCALES.map((locale) => messages[locale].nudge.variants[mood].length)
      expect(new Set(counts).size, mood).toBe(1)
    }
  })
})

describe('formatDuration', () => {
  it.each([
    ['ru', 45, '45 мин'],
    ['ru', 120, '2 ч'],
    ['ru', 200, '3 ч 20 мин'],
    ['en', 200, '3 h 20 min'],
  ] as const)('%s %d min → %s', (locale, minutes, expected) => {
    expect(formatDuration(locale, minutes)).toBe(expected)
  })
})
