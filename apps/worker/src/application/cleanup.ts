import type { Clock } from '@tuktuk/core'
import type { DeviceRepository } from './ports'

/**
 * A device without a push subscription after this long is abandoned: registration never
 * finished, someone scripted registrations, or the push service reported the subscription gone.
 * An installed app that is still alive simply registers again.
 */
export const ABANDONED_AFTER_DAYS = 7

const DAY_MS = 86_400_000

export const makeCleanup =
  (deps: { devices: DeviceRepository; clock: Clock }) => (): Promise<number> =>
    deps.devices.deleteAbandoned(
      new Date(deps.clock.now().getTime() - ABANDONED_AFTER_DAYS * DAY_MS),
    )
