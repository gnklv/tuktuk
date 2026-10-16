import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LocalDate, ReminderSnapshot } from '@tuktuk/core'
import { makeNudgeCycle } from './nudge-cycle'
import { InMemoryNudgeTargets, InMemorySubscriptions, RecordingPushSender } from '../testing/fakes'
import type { NudgeTarget } from './ports'

// Moscow (UTC+3): deadline 23:00, quiet hours 23:30–08:00
const snapshot = (pending: number, total = 3): ReminderSnapshot => ({
  settings: {
    locale: 'ru',
    timeZone: 'Europe/Moscow',
    dayDeadline: 1380,
    quietHours: { start: 1410, end: 480 },
  } as ReminderSnapshot['settings'],
  days: [
    { date: '2026-10-17' as LocalDate, total, pending },
    { date: '2026-10-18' as LocalDate, total: 1, pending: 1 },
  ],
})

const subscription = { endpoint: 'https://web.push.apple.com/x', keys: { p256dh: 'p', auth: 'a' } }
const target = (patch: Partial<NudgeTarget> = {}): NudgeTarget => ({
  deviceId: 'd1',
  subscription,
  snapshot: snapshot(2),
  lastNudge: null,
  ...patch,
})

/** Moscow wall-clock time on 2026-10-17. */
const moscow = (hhmm: string, date = '2026-10-17') => new Date(`${date}T${hhmm}:00+03:00`)

let targets: InMemoryNudgeTargets
let subscriptions: InMemorySubscriptions
let push: RecordingPushSender
let cycle: ReturnType<typeof makeNudgeCycle>

beforeEach(() => {
  targets = new InMemoryNudgeTargets()
  subscriptions = new InMemorySubscriptions()
  push = new RecordingPushSender()
  cycle = makeNudgeCycle({ targets, subscriptions, push })
})

describe('nudge cycle', () => {
  it('stays silent during quiet hours', async () => {
    targets.targets = [target()]
    expect(await cycle(moscow('07:30'))).toEqual({ checked: 1, sent: 0, gone: 0, failed: 0 })
  })

  it('sends the first reminder of the day with pressure and the local date, no titles', async () => {
    targets.targets = [target()]
    expect((await cycle(moscow('08:00'))).sent).toBe(1)
    expect(push.sent[0]?.payload).toEqual({
      type: 'nudge',
      locale: 'ru',
      date: '2026-10-17',
      pressure: expect.objectContaining({ level: 'calm', minutesLeft: 900, overdue: false }),
    })
    expect(targets.targets[0]?.lastNudge).toEqual({ date: '2026-10-17', at: moscow('08:00') })
  })

  it('spaces reminders with the same rule as the app', async () => {
    targets.targets = [target()]
    await cycle(moscow('08:00')) // pressure 0 → next in 180 min
    await cycle(moscow('10:59'))
    expect(push.sent).toHaveLength(1)
    await cycle(moscow('11:00'))
    expect(push.sent).toHaveLength(2)
  })

  it('ignores a reminder from yesterday', async () => {
    targets.targets = [
      target({ lastNudge: { date: '2026-10-16' as LocalDate, at: moscow('22:50', '2026-10-16') } }),
    ]
    expect((await cycle(moscow('08:00'))).sent).toBe(1)
  })

  it('skips days with nothing pending or not in the snapshot', async () => {
    targets.targets = [target({ snapshot: snapshot(0) })]
    expect((await cycle(moscow('12:00'))).sent).toBe(0)
    targets.targets = [target()]
    expect((await cycle(moscow('12:00', '2026-10-25'))).sent).toBe(0)
  })

  it('uses the next day from the snapshot after midnight', async () => {
    targets.targets = [target()]
    await cycle(moscow('09:00', '2026-10-18'))
    expect(push.sent[0]?.payload).toMatchObject({ date: '2026-10-18' })
  })

  it('removes subscriptions that are gone and keeps going after failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await subscriptions.save('gone', subscription)
    targets.targets = [target({ deviceId: 'gone' }), target({ deviceId: 'ok' })]
    push.send = vi
      .fn()
      .mockResolvedValueOnce('gone')
      .mockRejectedValueOnce(new Error('push service down'))
    expect(await cycle(moscow('09:00'))).toEqual({ checked: 2, sent: 0, gone: 1, failed: 1 })
    expect(await subscriptions.get('gone')).toBeNull()
  })
})
