import { onMounted, onUnmounted } from 'vue'

/**
 * Calls `onHidden` when the app leaves the screen: switching apps or tabs, locking the phone,
 * closing. On iOS the PWA is frozen right after, so it's the last moment to save or send.
 */
export function useAppHidden(onHidden: () => void) {
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') onHidden()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onHidden)
  })
  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', onHidden)
  })
}
