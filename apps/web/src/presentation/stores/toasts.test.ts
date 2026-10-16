import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { TOAST_DURATION_MS, useToastsStore } from './toasts'

beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
})
afterEach(() => vi.useRealTimers())

describe('toasts', () => {
  it('shows messages and hides each after a while', () => {
    const toasts = useToastsStore()
    toasts.show('Saved')
    vi.advanceTimersByTime(1000)
    toasts.show('Oops', 'error')
    expect(toasts.toasts.map((t) => [t.message, t.tone])).toEqual([
      ['Saved', 'info'],
      ['Oops', 'error'],
    ])

    vi.advanceTimersByTime(TOAST_DURATION_MS - 1000)
    expect(toasts.toasts.map((t) => t.message)).toEqual(['Oops'])
    vi.advanceTimersByTime(1000)
    expect(toasts.toasts).toEqual([])
  })

  it('can be dismissed early', () => {
    const toasts = useToastsStore()
    toasts.show('Saved')
    toasts.dismiss(toasts.toasts[0]!.id)
    expect(toasts.toasts).toEqual([])
  })
})
