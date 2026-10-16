import {
  THEMES,
  restoreSettings,
  type Settings,
  type SettingsRepository,
  type Theme,
} from '@tuktuk/core'
import { STORAGE_KEYS, readJson, writeJson } from './json-storage'

// Settings contain only JSON-safe values, so the DTO is the entity itself.
export class LocalStorageSettingsRepository implements SettingsRepository {
  private readonly key = STORAGE_KEYS.settings

  constructor(private readonly storage: Storage) {}

  async get(): Promise<Settings | null> {
    const value = readJson(this.storage, this.key)
    if (!value || typeof value !== 'object') return null
    const stored = value as Record<string, unknown>
    try {
      return restoreSettings({
        ...stored,
        // Stored before themes existed (or an unknown one): not worth losing the rest over.
        theme: THEMES.includes(stored.theme as Theme) ? stored.theme : 'system',
      })
    } catch (error) {
      console.warn('[storage] settings are corrupted, using defaults', error)
      return null
    }
  }

  async save(settings: Settings): Promise<void> {
    writeJson(this.storage, this.key, settings)
  }
}
