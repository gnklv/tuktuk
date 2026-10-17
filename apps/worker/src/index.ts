// Composition root of the push server: wires Cloudflare bindings into use cases and handlers.
import { makeDeviceUseCases } from './application/devices'
import { makeCleanup } from './application/cleanup'
import { makeNudgeCycle } from './application/nudge-cycle'
import { handleRequest } from './http/router'
import {
  D1DeviceRepository,
  D1NudgeTargetRepository,
  D1SnapshotRepository,
  D1SubscriptionRepository,
} from './infrastructure/d1-repositories'
import { systemClock } from './infrastructure/system-clock'
import { webCryptoSecrets } from './infrastructure/web-crypto-secrets'
import { WebPushSender } from './infrastructure/web-push-sender'

/** Must match the daily trigger in wrangler.jsonc. */
const CLEANUP_CRON = '0 3 * * *'

const pushSender = (env: Env) =>
  new WebPushSender({
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  })

export default {
  fetch(request, env) {
    const devices = makeDeviceUseCases({
      devices: new D1DeviceRepository(env.DB),
      subscriptions: new D1SubscriptionRepository(env.DB),
      snapshots: new D1SnapshotRepository(env.DB),
      secrets: webCryptoSecrets,
      clock: systemClock,
    })

    return handleRequest(request, {
      allowedOrigins: env.ALLOWED_ORIGINS,
      vapidPublicKey: env.VAPID_PUBLIC_KEY,
      pingDatabase: async () => {
        await env.DB.prepare('SELECT 1').first()
      },
      devices,
      allowRegistration: async (clientKey) =>
        (await env.REGISTRATION_LIMITER.limit({ key: clientKey })).success,
    })
  },

  /** Cron: reminders every minute, cleanup once a day (see wrangler.jsonc). */
  async scheduled(controller, env) {
    if (controller.cron === CLEANUP_CRON) {
      const deleted = await makeCleanup({
        devices: new D1DeviceRepository(env.DB),
        clock: systemClock,
      })()
      if (deleted) console.log('[cleanup] abandoned devices deleted:', deleted)
      return
    }

    const cycle = makeNudgeCycle({
      targets: new D1NudgeTargetRepository(env.DB),
      subscriptions: new D1SubscriptionRepository(env.DB),
      push: pushSender(env),
    })
    const report = await cycle(new Date(controller.scheduledTime))
    if (report.sent || report.gone || report.failed) console.log('[cron]', report)
  },
} satisfies ExportedHandler<Env>
