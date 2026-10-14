import { resolveLocale, type SettingsEnvironment } from '@tuktuk/core'

/** Defaults for first launch, taken from the browser. */
export const browserEnvironment = (): SettingsEnvironment => ({
  locale: resolveLocale(navigator.languages),
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
})
