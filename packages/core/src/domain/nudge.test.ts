import { describe, expect, it } from 'vitest'
import { composeNudge, nudgeMood } from './nudge'
import type { DayPressure } from './pressure'
import { fakeNudgeCopy } from '../testing'

const pressure = (patch: Partial<DayPressure> = {}): DayPressure => ({
  value: 0.5,
  level: 'insistent',
  elapsed: 0.7,
  minutesLeft: 200,
  overdue: false,
  ...patch,
})

const base = {
  locale: 'ru' as const,
  pressure: pressure(),
  pendingTitles: ['Call mom', 'Pay the bills'],
  previousId: null,
}

describe('composeNudge', () => {
  it('fills in a pending task and the time left', () => {
    const message = composeNudge(fakeNudgeCopy, { ...base, random: () => 0.6 })
    expect(message).toEqual({
      id: 'insistent:1',
      title: 'ru:insistent',
      body: '[insistent] #1 Pay the bills / 200m',
    })
  })

  it('does not repeat the previous message', () => {
    const first = composeNudge(fakeNudgeCopy, { ...base, random: () => 0 })
    const second = composeNudge(fakeNudgeCopy, { ...base, previousId: first.id, random: () => 0 })
    expect(second.id).not.toBe(first.id)
  })

  it('uses the overdue mood after the deadline', () => {
    const message = composeNudge(fakeNudgeCopy, {
      ...base,
      pressure: pressure({ level: 'panic', overdue: true, minutesLeft: 0 }),
      random: () => 0,
    })
    expect(message.id).toBe('overdue:0')
  })

  it('maps pressure to a mood', () => {
    expect(nudgeMood(pressure({ level: 'calm' }))).toBe('calm')
    expect(nudgeMood(pressure({ level: 'panic', overdue: true }))).toBe('overdue')
  })
})
