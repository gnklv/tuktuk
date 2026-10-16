import { STORAGE_KEYS, readJson, writeJson } from './json-storage'

interface UiPrefsDto {
  summarySeenOn?: string
}

export class LocalStorageUiPrefs {
  private readonly key = STORAGE_KEYS.uiPrefs

  constructor(private readonly storage: Storage) {}

  private read(): UiPrefsDto {
    const value = readJson(this.storage, this.key)
    return value && typeof value === 'object' ? (value as UiPrefsDto) : {}
  }

  summarySeenOn(): string | null {
    return this.read().summarySeenOn ?? null
  }

  markSummarySeen(date: string): void {
    writeJson(this.storage, this.key, { ...this.read(), summarySeenOn: date })
  }
}
