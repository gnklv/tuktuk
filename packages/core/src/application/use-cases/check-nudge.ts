import { buildDayOverview } from '../../domain/day-overview'
import { toLocalDate } from '../../domain/local-date'
import { composeNudge, type NudgeCopy } from '../../domain/nudge-messages'
import { computePressure, nextNudgeAt } from '../../domain/pressure'
import type { Settings } from '../../domain/settings'
import type { Clock } from '../ports/clock'
import type { CompletionRepository } from '../ports/completion-repository'
import type { Notifier } from '../ports/notifier'
import type { NudgeLogRepository } from '../ports/nudge-log-repository'
import type { TaskRepository } from '../ports/task-repository'

/**
 * - `notify` — show the reminder as a system notification.
 * - `silent` — don't show it, but count it, so the schedule moves on as if it was shown.
 *   For when a notification would be noise (the user is looking at the app) or another
 *   channel delivers reminders (Web Push from the server).
 */
export type NudgeDelivery = 'notify' | 'silent'

export interface CheckNudgeInput {
  settings: Settings
  delivery: NudgeDelivery
}

export interface CheckNudgeResult {
  /** A reminder was due and has been handled now. */
  readonly nudged: boolean
  /** When to check again; `null` — nothing pending today. */
  readonly nextAt: Date | null
}

/** Decides whether it's time to remind, and if so, reminds. Safe to call as often as you like. */
export const makeCheckNudge =
  (deps: {
    clock: Clock
    taskRepo: TaskRepository
    completionRepo: CompletionRepository
    nudgeLog: NudgeLogRepository
    notifier: Notifier
    /** Reminder wording, from `@tuktuk/i18n`. */
    copy: NudgeCopy
    random: () => number
  }) =>
  async ({ settings, delivery }: CheckNudgeInput): Promise<CheckNudgeResult> => {
    const now = deps.clock.now()
    const today = toLocalDate(now, settings.timeZone)
    const [tasks, completions, last] = await Promise.all([
      deps.taskRepo.getAll(),
      deps.completionRepo.getByDate(today),
      deps.nudgeLog.getLast(),
    ])

    const day = buildDayOverview(today, tasks, completions)
    const pendingTitles = day.items.filter((i) => i.completedAt === null).map((i) => i.task.title)
    const counts = { pending: pendingTitles.length, total: day.items.length }
    const lastToday = last?.date === today ? last : null

    const dueAt = nextNudgeAt({ now, settings, ...counts, lastNudgeAt: lastToday?.at ?? null })
    if (!dueAt || dueAt > now) return { nudged: false, nextAt: dueAt }

    const message = composeNudge(deps.copy, {
      locale: settings.locale,
      pressure: computePressure({ now, settings, ...counts }),
      pendingTitles,
      previousId: last?.messageId ?? null,
      random: deps.random,
    })
    if (delivery === 'notify') await deps.notifier.show(message)
    await deps.nudgeLog.save({ date: today, at: now, messageId: message.id })

    return { nudged: true, nextAt: nextNudgeAt({ now, settings, ...counts, lastNudgeAt: now }) }
  }
