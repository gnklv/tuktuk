import { beforeEach, describe, expect, it } from 'vitest'
import {
  InMemoryCompletionRepository,
  InMemoryNudgeLog,
  InMemoryTaskRepository,
  RecordingNotifier,
  fakeNudgeCopy,
  fakeClock,
  sequentialIds,
} from '../../testing'
import { createDefaultSettings } from '../../domain/settings'
import type { LocalDate } from '../../domain/local-date'
import { makeAddTask } from './add-task'
import { makeCheckNudge } from './check-nudge'
import { makeToggleCompletion } from './toggle-completion'

// UTC; deadline 23:00, quiet hours 23:30–08:00
const settings = createDefaultSettings({ locale: 'en', timeZone: 'UTC' })
const today = '2026-10-14' as LocalDate
const at = (hhmm: string) => `2026-10-14T${hhmm}:00Z`

let clock: ReturnType<typeof fakeClock>
let taskRepo: InMemoryTaskRepository
let completionRepo: InMemoryCompletionRepository
let nudgeLog: InMemoryNudgeLog
let notifier: RecordingNotifier
let check: ReturnType<typeof makeCheckNudge>

beforeEach(async () => {
  clock = fakeClock(at('07:00'))
  taskRepo = new InMemoryTaskRepository()
  completionRepo = new InMemoryCompletionRepository()
  nudgeLog = new InMemoryNudgeLog()
  notifier = new RecordingNotifier()
  check = makeCheckNudge({
    clock,
    taskRepo,
    completionRepo,
    nudgeLog,
    notifier,
    copy: fakeNudgeCopy,
    random: () => 0,
  })
  await makeAddTask({ taskRepo, ids: sequentialIds(), clock })(
    { title: 'Call mom', schedule: { kind: 'once', date: today } },
    today,
  )
})

const run = (userIsLooking = false) => check({ settings, userIsLooking })

describe('checkNudge', () => {
  it('waits for the end of quiet hours', async () => {
    expect(await run()).toEqual({ nudged: false, nextAt: new Date(at('08:00')) })
    expect(notifier.shown).toEqual([])
  })

  it('nudges at the start of the day and schedules the next one', async () => {
    clock.set(at('08:00'))
    const result = await run()
    expect(result.nudged).toBe(true)
    expect(result.nextAt).toEqual(new Date(at('11:00'))) // calm → 180 min
    expect(notifier.shown[0]?.body).toContain('Call mom')
    expect(nudgeLog.last).toMatchObject({ date: today, at: new Date(at('08:00')) })
  })

  it('does not nudge again before the next one is due, even after a reload', async () => {
    clock.set(at('08:00'))
    await run()
    clock.set(at('10:59'))
    expect((await run()).nudged).toBe(false)
    clock.set(at('11:00'))
    expect((await run()).nudged).toBe(true)
    expect(notifier.shown).toHaveLength(2)
    expect(notifier.shown[1]?.id).not.toBe(notifier.shown[0]?.id)
  })

  it('counts a nudge without a notification while the user is looking at the app', async () => {
    clock.set(at('09:00'))
    expect((await run(true)).nudged).toBe(true)
    expect(notifier.shown).toEqual([])
    expect(nudgeLog.last?.at).toEqual(new Date(at('09:00')))
  })

  it('ignores the last nudge of a previous day', async () => {
    nudgeLog.last = {
      date: '2026-10-13' as LocalDate,
      at: new Date('2026-10-13T22:50:00Z'),
      messageId: 'panic:0',
    }
    clock.set(at('08:00'))
    expect((await run()).nudged).toBe(true)
  })

  it('stops once everything is done', async () => {
    clock.set(at('12:00'))
    const [task] = await taskRepo.getAll()
    await makeToggleCompletion({ taskRepo, completionRepo, clock })(task!.id, today)
    expect(await run()).toEqual({ nudged: false, nextAt: null })
    expect(notifier.shown).toEqual([])
  })
})
