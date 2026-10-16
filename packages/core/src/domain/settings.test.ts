import { describe, expect, it } from 'vitest'
import { changeSettings, createDefaultSettings } from './settings'
import { parseTimeOfDay, timeOfDay } from './time-of-day'

const t = parseTimeOfDay
const defaults = createDefaultSettings({ locale: 'ru', timeZone: 'Europe/Moscow' })

describe('createDefaultSettings', () => {
  it('uses the environment and sane defaults', () => {
    expect(defaults).toEqual({
      locale: 'ru',
      timeZone: 'Europe/Moscow',
      dayDeadline: t('23:00'),
      quietHours: { start: t('23:30'), end: t('08:00') },
      theme: 'system',
    })
  })
})

describe('changeSettings', () => {
  it('applies a valid patch', () => {
    expect(changeSettings(defaults, { dayDeadline: t('21:00') }).dayDeadline).toBe(t('21:00'))
    expect(changeSettings(defaults, { theme: 'dark', locale: 'en' })).toMatchObject({
      theme: 'dark',
      locale: 'en',
    })
  })

  it('allows midnight at the end of the day and turning quiet hours off', () => {
    const settings = changeSettings(defaults, { dayDeadline: timeOfDay(24), quietHours: null })
    expect(settings.dayDeadline).toBe(1440)
  })

  it('allows the deadline exactly when quiet hours start', () => {
    expect(() => changeSettings(defaults, { dayDeadline: t('23:30') })).not.toThrow()
  })

  it('rejects a deadline inside quiet hours', () => {
    expect(() => changeSettings(defaults, { dayDeadline: t('23:45') })).toThrow(
      'settings.deadlineInQuietHours',
    )
    expect(() => changeSettings(defaults, { dayDeadline: t('07:00') })).toThrow(
      'settings.deadlineInQuietHours',
    )
    // 24:00 is 00:00 of the quiet range 23:30–08:00.
    expect(() => changeSettings(defaults, { dayDeadline: timeOfDay(24) })).toThrow(
      'settings.deadlineInQuietHours',
    )
    expect(() =>
      changeSettings(defaults, { quietHours: { start: t('22:00'), end: t('08:00') } }),
    ).toThrow('settings.deadlineInQuietHours')
  })

  it('rejects empty quiet hours and a deadline at the very start of the day', () => {
    expect(() =>
      changeSettings(defaults, { quietHours: { start: t('08:00'), end: t('08:00') } }),
    ).toThrow('settings.quietHoursEmpty')
    expect(() => changeSettings(defaults, { dayDeadline: timeOfDay(0) })).toThrow(
      'settings.deadlineAtDayStart',
    )
  })
})
