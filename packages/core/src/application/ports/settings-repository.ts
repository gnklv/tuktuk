import type { Settings } from '../../domain/settings'

export interface SettingsRepository {
  /** `null` on first launch, before settings were ever saved. */
  get(): Promise<Settings | null>
  save(settings: Settings): Promise<void>
}
