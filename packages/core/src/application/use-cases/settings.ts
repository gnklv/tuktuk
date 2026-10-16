import type { Locale } from '../../domain/locale'
import { changeSettings, createDefaultSettings, type Settings } from '../../domain/settings'
import type { SettingsRepository } from '../ports/settings-repository'

/** Where defaults come from on first launch (e.g. the browser's language and timezone). */
export interface SettingsEnvironment {
  locale: Locale
  timeZone: string
}

export const makeGetSettings =
  (deps: { settingsRepo: SettingsRepository }) =>
  async (env: SettingsEnvironment): Promise<Settings> =>
    (await deps.settingsRepo.get()) ?? createDefaultSettings(env)

export const makeUpdateSettings = (deps: { settingsRepo: SettingsRepository }) => {
  const getSettings = makeGetSettings(deps)
  return async (patch: Partial<Settings>, env: SettingsEnvironment): Promise<Settings> => {
    const next = changeSettings(await getSettings(env), patch)
    await deps.settingsRepo.save(next)
    return next
  }
}
