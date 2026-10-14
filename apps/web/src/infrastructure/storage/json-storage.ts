/** Versioned keys: bump the version when the stored shape changes incompatibly. */
export const STORAGE_KEYS = {
  tasks: 'tuktuk:v1:tasks',
  completions: 'tuktuk:v1:completions',
  settings: 'tuktuk:v1:settings',
} as const

export function readJson(storage: Storage, key: string): unknown {
  const raw = storage.getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    console.warn(`[storage] ${key} is not valid JSON, ignoring it`)
    return null
  }
}

export function writeJson(storage: Storage, key: string, value: unknown): void {
  storage.setItem(key, JSON.stringify(value))
}

/** Maps every item, dropping (and reporting) the ones that fail to parse. */
export function parseList<T>(value: unknown, key: string, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    try {
      return [parse(item)]
    } catch (error) {
      console.warn(`[storage] dropping a broken item from ${key}`, item, error)
      return []
    }
  })
}
