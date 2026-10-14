import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { Settings } from '@tuktuk/core'
import { useInitialSettings, useUseCases } from '../di'

export const useSettingsStore = defineStore('settings', () => {
  const useCases = useUseCases()
  const settings = shallowRef<Settings>(useInitialSettings())

  async function update(patch: Partial<Settings>) {
    settings.value = await useCases.updateSettings(patch)
  }

  return { settings, update }
})
