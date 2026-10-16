import type { LocalDate, NudgeLogEntry, NudgeLogRepository } from '@tuktuk/core'
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
    if (!dto || typeof dto.date !== 'string' || typeof dto.at !== 'string') return null
    return { date: dto.date as LocalDate, at: new Date(dto.at), messageId: dto.messageId ?? '' }
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
