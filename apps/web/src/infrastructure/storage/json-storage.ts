/** Versioned keys: bump the version when the stored shape changes incompatibly. */
export const STORAGE_KEYS = {
  tasks: 'tuktuk:v1:tasks',
  completions: 'tuktuk:v1:completions',
  settings: 'tuktuk:v1:settings',
  nudgeLog: 'tuktuk:v1:nudge-log',
  uiPrefs: 'tuktuk:v1:ui-prefs',
} as const

/** Where unreadable data is moved, so nothing is lost silently and the main key heals. */
const droppedKey = (key: string) => `${key}:dropped`

/**
 * Reads a JSON value. Unreadable JSON is moved to `<key>:dropped` (with one warning), so it
 * doesn't break — or warn on — every following read.
 */
export function readJson(storage: Storage, key: string): unknown {
  const raw = storage.getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    console.warn(`[storage] ${key} is not valid JSON; moved it to ${droppedKey(key)}`)
    storage.setItem(droppedKey(key), raw)
    storage.removeItem(key)
    return null
  }
}

export function writeJson(storage: Storage, key: string, value: unknown): void {
  storage.setItem(key, JSON.stringify(value))
}

/**
 * Reads a stored list, parsing each item. Items that fail to parse are moved to
 * `<key>:dropped` once, with one warning, and the list is rewritten without them.
 */
export function readList<T>(storage: Storage, key: string, parse: (item: unknown) => T): T[] {
  const value = readJson(storage, key)
  if (!Array.isArray(value)) return []

  const items: T[] = []
  const kept: unknown[] = []
  const dropped: unknown[] = []
  for (const raw of value) {
    try {
      items.push(parse(raw))
      kept.push(raw)
    } catch (error) {
      dropped.push({ item: raw, error: String(error) })
    }
  }

  if (dropped.length > 0) {
    console.warn(
      `[storage] moved ${dropped.length} broken item(s) from ${key} to ${droppedKey(key)}`,
    )
    const earlier = readJson(storage, droppedKey(key))
    writeJson(storage, droppedKey(key), [...(Array.isArray(earlier) ? earlier : []), ...dropped])
    writeJson(storage, key, kept)
  }
  return items
}
