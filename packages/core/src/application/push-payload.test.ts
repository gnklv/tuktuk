import { describe, expect, it } from 'vitest'
import { parsePushPayload } from './push-payload'

describe('parsePushPayload', () => {
  it('accepts a test payload', () => {
    expect(parsePushPayload({ type: 'test', locale: 'ru' })).toEqual({ type: 'test', locale: 'ru' })
  })

  it.each([null, 'test', 42, {}, { type: 'test' }, { type: 'test', locale: 'de' }, { type: 'x' }])(
    'rejects %j',
    (data) => {
      expect(parsePushPayload(data)).toBeNull()
    },
  )
})
