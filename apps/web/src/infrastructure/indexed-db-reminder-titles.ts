import type { LocalDate, PendingTitles } from '@tuktuk/core'
import type { LocalTitlesStore } from '../application/ports'

/**
 * Pending task titles kept in IndexedDB for the Service Worker, which composes push texts
 * on the device (it can't read localStorage). Used by both the app and the Service Worker.
 */
export class IndexedDbReminderTitles implements LocalTitlesStore {
  private static readonly DB = 'tuktuk'
  private static readonly STORE = 'kv'
  private static readonly TITLES = 'pending-titles'
  private static readonly LAST_MESSAGE = 'last-nudge-message'

  save(titles: PendingTitles): Promise<void> {
    return this.run('readwrite', (s) => s.put(titles, IndexedDbReminderTitles.TITLES))
  }

  async forDate(date: LocalDate): Promise<readonly string[]> {
    const titles = await this.run<PendingTitles | undefined>('readonly', (s) =>
      s.get(IndexedDbReminderTitles.TITLES),
    )
    return titles?.[date] ?? []
  }

  async lastMessageId(): Promise<string | null> {
    return (
      (await this.run<string | undefined>('readonly', (s) =>
        s.get(IndexedDbReminderTitles.LAST_MESSAGE),
      )) ?? null
    )
  }

  setLastMessageId(id: string): Promise<void> {
    return this.run('readwrite', (s) => s.put(id, IndexedDbReminderTitles.LAST_MESSAGE))
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IndexedDbReminderTitles.DB, 1)
      request.onupgradeneeded = () =>
        request.result.createObjectStore(IndexedDbReminderTitles.STORE)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async run<T = void>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest,
  ): Promise<T> {
    const db = await this.open()
    try {
      return await new Promise<T>((resolve, reject) => {
        const request = action(
          db
            .transaction(IndexedDbReminderTitles.STORE, mode)
            .objectStore(IndexedDbReminderTitles.STORE),
        )
        request.onsuccess = () => resolve(request.result as T)
        request.onerror = () => reject(request.error)
      })
    } finally {
      db.close()
    }
  }
}
