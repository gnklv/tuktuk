import { watchEffect } from 'vue'
import { useAppI18n } from '../i18n'
import { useSettingsStore } from '../stores/settings'
import { useTodayStore } from '../stores/today'

/** Reflects app state on <html>: language, title, theme and pressure. Used once, in App.vue. */
export function useDocumentSync() {
  const { t, locale } = useAppI18n()
  const settings = useSettingsStore()
  const today = useTodayStore()
  const root = document.documentElement

  watchEffect(() => {
    locale.value = settings.settings.locale
    root.lang = locale.value
    document.title = t('app.name')
  })

  watchEffect(() => {
    const { theme } = settings.settings
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
  })

  // The whole UI "heats up" towards the deadline: tokens.css derives colors from --pressure.
  watchEffect(() => {
    root.style.setProperty('--pressure', String(today.pressure.value))
  })
}
