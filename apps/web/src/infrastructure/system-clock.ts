import type { Clock } from '@tuktuk/core'

export const systemClock: Clock = {
  now: () => new Date(),
}
