import { describe, expect, it } from 'vitest'
import { parsePushPayload } from './push-payload'

const pressure = { value: 0.6, level: 'annoyed', elapsed: 0.8, minutesLeft: 90, overdue: false }

describe('parsePushPayload', () => {
  it('accepts a test payload', () => {
    expect(parsePushPayload({ type: 'test', locale: 'ru' })).toEqual({ type: 'test', locale: 'ru' })
  })

  it('accepts a nudge payload', () => {
    const nudge = { type: 'nudge', locale: 'en', date: '2026-10-17', pressure }
    expect(parsePushPayload(nudge)).toEqual(nudge)
  })

  it.each([
    null,
    'test',
    42,
    {},
    { type: 'test' },
    { type: 'test', locale: 'de' },
    { type: 'x', locale: 'ru' },
    { type: 'nudge', locale: 'ru', date: '2026-10-17' },
    { type: 'nudge', locale: 'ru', date: 'tomorrow', pressure },
    { type: 'nudge', locale: 'ru', date: '2026-10-17', pressure: { ...pressure, level: 'meh' } },
    { type: 'nudge', locale: 'ru', date: '2026-10-17', pressure: { ...pressure, value: 2 } },
  ])('rejects %j', (data) => {
    expect(parsePushPayload(data)).toBeNull()
  })
})
