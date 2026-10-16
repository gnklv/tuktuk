import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export interface Toast {
  readonly id: number
  readonly message: string
  readonly tone: 'info' | 'error'
}

/** How long a toast stays on screen. */
export const TOAST_DURATION_MS = 4000

/** Short-lived messages shown above any screen (see ToastHost). */
export const useToastsStore = defineStore('toasts', () => {
  const toasts = shallowRef<readonly Toast[]>([])
  let nextId = 1

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function show(message: string, tone: Toast['tone'] = 'info') {
    const toast = { id: nextId++, message, tone }
    toasts.value = [...toasts.value, toast]
    setTimeout(() => dismiss(toast.id), TOAST_DURATION_MS)
  }

  return { toasts, show, dismiss }
})
