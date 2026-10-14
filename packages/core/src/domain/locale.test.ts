import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, isLocale, resolveLocale } from './locale'

describe('resolveLocale', () => {
  it('returns an exact supported match', () => {
    expect(resolveLocale(['ru'])).toBe('ru')
    expect(resolveLocale(['en'])).toBe('en')
  })

  it('ignores region subtags and case', () => {
    expect(resolveLocale(['ru-RU'])).toBe('ru')
    expect(resolveLocale(['EN-gb'])).toBe('en')
  })

  it('respects the order of preference', () => {
    expect(resolveLocale(['de-DE', 'en-US', 'ru'])).toBe('en')
    expect(resolveLocale(['ru', 'en'])).toBe('ru')
  })

  it('falls back to the default locale', () => {
    expect(resolveLocale(['de', 'fr-FR'])).toBe(DEFAULT_LOCALE)
    expect(resolveLocale([])).toBe(DEFAULT_LOCALE)
  })
})

describe('isLocale', () => {
  it('accepts only supported locales', () => {
    expect(isLocale('ru')).toBe(true)
    expect(isLocale('ru-RU')).toBe(false)
    expect(isLocale('')).toBe(false)
  })
})
