import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DayPressure, LocalDate } from '@tuktuk/core'
import { fakeNudgeCopy } from '@tuktuk/core/testing'
import { makeComposePush, type PushTexts } from './compose-push'
import type { PushTitlesSource } from './ports'

const texts = (locale: string): PushTexts => ({
  appName: `${locale}:app`,
  fallback: (mood) => `${locale}:fallback:${mood}`,
})

const pressure: DayPressure = {
  value: 0.7,
  level: 'annoyed',
  elapsed: 0.85,
  minutesLeft: 90,
  overdue: false,
}
const nudge = { type: 'nudge', locale: 'ru', date: '2026-10-17', pressure }

class FakeTitles implements PushTitlesSource {
  constructor(
    public byDate: Record<string, string[]> = {},
    public last: string | null = null,
  ) {}
  async forDate(date: LocalDate) {
    return this.byDate[date] ?? []
  }
  async lastMessageId() {
    return this.last
  }
  async setLastMessageId(id: string) {
    this.last = id
  }
}

let titles: FakeTitles
let compose: ReturnType<typeof makeComposePush>

beforeEach(() => {
  titles = new FakeTitles({ '2026-10-17': ['Call mom'] })
  compose = makeComposePush({ titles, copy: fakeNudgeCopy, texts, random: () => 0 })
})

describe('composePush', () => {
  it('words a reminder with a local title and remembers it', async () => {
    expect(await compose(nudge)).toEqual({
      title: 'ru:annoyed',
      body: '[annoyed] #0 Call mom / 90m',
    })
    expect(titles.last).toBe('annoyed:0')
  })

  it('does not repeat the previous reminder text', async () => {
    const first = await compose(nudge)
    const second = await compose(nudge)
    expect(second.body).not.toBe(first.body)
  })

  it('uses the titles of the day the reminder is about', async () => {
    titles.byDate = { '2026-10-18': ['Tomorrow only'] }
    expect((await compose(nudge)).body).toBe('ru:fallback:annoyed')
  })

  it('falls back to the mascot line without local titles', async () => {
    titles.byDate = {}
    expect(await compose(nudge)).toEqual({ title: 'ru:annoyed', body: 'ru:fallback:annoyed' })
  })

  it('falls back when local storage fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    titles.forDate = async () => Promise.reject(new Error('IndexedDB is gone'))
    expect((await compose(nudge)).body).toBe('ru:fallback:annoyed')
  })

  it('uses the overdue mood after the deadline', async () => {
    titles.byDate = {}
    const late = { ...nudge, pressure: { ...pressure, overdue: true, minutesLeft: 0 } }
    expect(await compose(late)).toEqual({ title: 'ru:overdue', body: 'ru:fallback:overdue' })
  })

  it('still shows something for data it does not understand, in its locale if known', async () => {
    expect(await compose({ type: 'future-thing', locale: 'ru' })).toEqual({
      title: 'ru:app',
      body: '',
    })
    expect(await compose({ type: 'nudge', locale: 'ru' })).toEqual({ title: 'ru:app', body: '' })
    for (const data of [null, 'garbage', { type: 'x', locale: 'de' }]) {
      expect(await compose(data)).toEqual({ title: 'en:app', body: '' })
    }
  })
})
