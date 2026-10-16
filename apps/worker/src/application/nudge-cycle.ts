import { computePressure, dayCountsOn, nextNudgeAt, toLocalDate } from '@tuktuk/core'
import type {
  NudgeTarget,
  NudgeTargetRepository,
  PushSender,
  SubscriptionRepository,
} from './ports'

export interface NudgeCycleDeps {
  targets: NudgeTargetRepository
  subscriptions: SubscriptionRepository
  push: PushSender
}

export interface NudgeCycleReport {
  checked: number
  sent: number
  gone: number
  failed: number
}

/**
 * One run of the scheduler (every minute): for each device decide with the same core rules as
 * the app (`nextNudgeAt`) whether a reminder is due, and send it. The payload has no task titles —
 * the device composes the text.
 */
export const makeNudgeCycle =
  (deps: NudgeCycleDeps) =>
  async (now: Date): Promise<NudgeCycleReport> => {
    const targets = await deps.targets.listActive()
    const results = await Promise.allSettled(targets.map((target) => nudge(target, now, deps)))

    const report: NudgeCycleReport = { checked: targets.length, sent: 0, gone: 0, failed: 0 }
    for (const result of results) {
      if (result.status === 'rejected') {
        report.failed++
        console.error('[cron] reminder failed', result.reason)
      } else if (result.value !== 'skipped') {
        report[result.value]++
      }
    }
    return report
  }

async function nudge(
  { deviceId, subscription, snapshot, lastNudge }: NudgeTarget,
  now: Date,
  deps: NudgeCycleDeps,
): Promise<'sent' | 'gone' | 'skipped'> {
  const settings = { ...snapshot.settings, theme: 'system' as const }
  const date = toLocalDate(now, settings.timeZone)
  const counts = dayCountsOn(snapshot, date)
  if (!counts || counts.pending === 0) return 'skipped'

  const input = { now, settings, pending: counts.pending, total: counts.total }
  const dueAt = nextNudgeAt({
    ...input,
    lastNudgeAt: lastNudge?.date === date ? lastNudge.at : null,
  })
  if (!dueAt || dueAt > now) return 'skipped'

  const result = await deps.push.send(subscription, {
    type: 'nudge',
    locale: settings.locale,
    date,
    pressure: computePressure(input),
  })
  if (result === 'gone') {
    await deps.subscriptions.remove(deviceId)
    return 'gone'
  }
  await deps.targets.recordNudge(deviceId, date, now)
  return 'sent'
}
