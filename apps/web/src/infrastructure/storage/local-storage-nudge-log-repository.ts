import { parseLocalDate, type NudgeLogEntry, type NudgeLogRepository } from '@tuktuk/core'
import { STORAGE_KEYS, readJson, writeJson } from './json-storage'

interface NudgeLogDto {
  date: string
  at: string
  messageId: string
}

export class LocalStorageNudgeLogRepository implements NudgeLogRepository {
  private readonly key = STORAGE_KEYS.nudgeLog

  constructor(private readonly storage: Storage) {}

  async getLast(): Promise<NudgeLogEntry | null> {
    const dto = readJson(this.storage, this.key) as Partial<NudgeLogDto> | null
    if (!dto || typeof dto.at !== 'string') return null
    try {
      const at = new Date(dto.at)
      if (Number.isNaN(at.getTime())) return null
      return { date: parseLocalDate(String(dto.date)), at, messageId: dto.messageId ?? '' }
    } catch {
      return null // a broken log only means the next reminder isn't spaced from it
    }
  }

  async save(entry: NudgeLogEntry): Promise<void> {
    const dto: NudgeLogDto = {
      date: entry.date,
      at: entry.at.toISOString(),
      messageId: entry.messageId,
    }
    writeJson(this.storage, this.key, dto)
  }
}
