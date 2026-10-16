// Composition root of the push server: wires Cloudflare bindings into use cases and handlers.
import { makeDeviceUseCases } from './application/devices'
import { handleRequest } from './http/router'
import {
  D1DeviceRepository,
  D1SnapshotRepository,
  D1SubscriptionRepository,
} from './infrastructure/d1-repositories'
import { webCryptoSecrets } from './infrastructure/web-crypto-secrets'
import { WebPushSender } from './infrastructure/web-push-sender'

export default {
  fetch(request, env, ctx) {
    const devices = makeDeviceUseCases({
      devices: new D1DeviceRepository(env.DB),
      subscriptions: new D1SubscriptionRepository(env.DB),
      snapshots: new D1SnapshotRepository(env.DB),
      secrets: webCryptoSecrets,
      push: new WebPushSender({
        subject: env.VAPID_SUBJECT,
        publicKey: env.VAPID_PUBLIC_KEY,
        privateKey: env.VAPID_PRIVATE_KEY,
      }),
      now: () => new Date(),
    })

    return handleRequest(request, {
      allowedOrigins: env.ALLOWED_ORIGINS,
      vapidPublicKey: env.VAPID_PUBLIC_KEY,
      pingDatabase: async () => {
        await env.DB.prepare('SELECT 1').first()
      },
      devices,
      defer: (task) => ctx.waitUntil(task),
      sleep: (ms) => scheduler.wait(ms),
    })
  },
} satisfies ExportedHandler<Env>
