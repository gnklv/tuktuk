import type { IdGenerator } from '@tuktuk/core'

export const cryptoIdGenerator: IdGenerator = {
  next: () => crypto.randomUUID(),
}
