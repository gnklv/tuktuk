import { describe, expect, it } from 'vitest'
import { fakeClock } from '@tuktuk/core/testing'
import { ABANDONED_AFTER_DAYS, makeCleanup } from './cleanup'
import { InMemoryDevices } from '../testing/fakes'

describe('cleanup', () => {
  it(`deletes devices older than ${ABANDONED_AFTER_DAYS} days`, async () => {
    const devices = new InMemoryDevices()
    await devices.create({ id: 'old', tokenHash: 'h', createdAt: new Date('2026-10-09T00:00:00Z') })
    await devices.create({ id: 'new', tokenHash: 'h', createdAt: new Date('2026-10-11T00:00:00Z') })

    const cleanup = makeCleanup({ devices, clock: fakeClock('2026-10-17T03:00:00Z') })
    expect(await cleanup()).toBe(1)
    expect([...devices.all.keys()]).toEqual(['new'])
  })
})
