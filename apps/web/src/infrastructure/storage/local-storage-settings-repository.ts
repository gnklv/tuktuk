import {
  THEMES,
  isLocale,
  type Settings,
  type SettingsRepository,
  type Theme,
  type TimeOfDay,
} from '@tuktuk/core'
import { STORAGE_KEYS, readJson, writeJson } from './json-storage'

// Settings contain only JSON-safe values, so the DTO is the entity itself.
export class LocalStorageSettingsRepository implements SettingsRepository {
  private readonly key = STORAGE_KEYS.settings

  constructor(private readonly storage: Storage) {}

  async get(): Promise<Settings | null> {
    const value = readJson(this.storage, this.key) as Partial<Settings> | null
    if (
      !value ||
      typeof value.locale !== 'string' ||
      !isLocale(value.locale) ||
      typeof value.timeZone !== 'string' ||
      typeof value.dayDeadline !== 'number'
    ) {
      return null
    }
    return {
      locale: value.locale,
      timeZone: value.timeZone,
      dayDeadline: value.dayDeadline as TimeOfDay,
      quietHours: value.quietHours ?? null,
      // Missing in settings saved before themes existed.
      theme: THEMES.includes(value.theme as Theme) ? (value.theme as Theme) : 'system',
    }
  }

  async save(settings: Settings): Promise<void> {
    writeJson(this.storage, this.key, settings)
  }
}
