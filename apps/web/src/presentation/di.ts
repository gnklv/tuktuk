import { inject, type InjectionKey } from 'vue'
import type { Clock } from '@tuktuk/core'

export const ClockKey: InjectionKey<Clock> = Symbol('Clock')

function injectStrict<T>(key: InjectionKey<T>): T {
  const value = inject(key)
  if (value === undefined) {
    throw new Error(`Dependency ${String(key.description)} is not provided`)
  }
  return value
}

export const useClock = (): Clock => injectStrict(ClockKey)
