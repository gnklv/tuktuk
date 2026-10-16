import type { LocalDate, PendingTitles } from '@tuktuk/core'

/**
 * Pending task titles kept in IndexedDB for the Service Worker, which composes push texts
 * on the device (it can't read localStorage). Shared by the app and the Service Worker.
 */

const DB_NAME = 'tuktuk'
const STORE = 'kv'
const TITLES_KEY = 'pending-titles'
const LAST_MESSAGE_KEY = 'last-nudge-message'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE))
      request.onsuccess = () => resolve(request.result as T)
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}

export const reminderTitles = {
  save: (titles: PendingTitles) => run<void>('readwrite', (s) => s.put(titles, TITLES_KEY)),

  async forDate(date: LocalDate): Promise<readonly string[]> {
    const titles = await run<PendingTitles | undefined>('readonly', (s) => s.get(TITLES_KEY))
    return titles?.[date] ?? []
  },

  lastMessageId: async () =>
    (await run<string | undefined>('readonly', (s) => s.get(LAST_MESSAGE_KEY))) ?? null,

  setLastMessageId: (id: string) => run<void>('readwrite', (s) => s.put(id, LAST_MESSAGE_KEY)),
}
