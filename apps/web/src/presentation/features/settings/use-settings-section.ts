import { computed, ref } from 'vue'
import type { Settings } from '@tuktuk/core'
import { useAppI18n } from '../../i18n'
import { errorMessageKey } from '../../i18n/errors'
import { useSettingsStore } from '../../stores/settings'

/**
 * Saving from one settings section: instant save, the error shown in that section,
 * and a `revision` to re-render inputs with the saved value after a rejected change.
 */
export function useSettingsSection() {
  const { t } = useAppI18n()
  const store = useSettingsStore()
  const error = ref<string | null>(null)
  const revision = ref(0)

  async function save(patch: Partial<Settings>) {
    try {
      await store.update(patch)
      error.value = null
    } catch (e) {
      error.value = t(errorMessageKey(e))
      revision.value++
    }
  }

  return { settings: computed(() => store.settings), save, error, revision }
}
