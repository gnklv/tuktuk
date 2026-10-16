import type { LocalDate } from '@tuktuk/core'
import type { UiPrefs } from '../../application/ports'
import { STORAGE_KEYS, readJson, writeJson } from './json-storage'

interface UiPrefsDto {
  summarySeenOn?: string
}

export class LocalStorageUiPrefs implements UiPrefs {
  private readonly key = STORAGE_KEYS.uiPrefs

  constructor(private readonly storage: Storage) {}

  private read(): UiPrefsDto {
    const value = readJson(this.storage, this.key)
    return value && typeof value === 'object' ? (value as UiPrefsDto) : {}
  }

  summarySeenOn(): LocalDate | null {
    return (this.read().summarySeenOn as LocalDate | undefined) ?? null
  }

  markSummarySeen(date: LocalDate): void {
    writeJson(this.storage, this.key, { ...this.read(), summarySeenOn: date })
  }
}
