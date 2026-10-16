// Test helper: a real local D1 database (Miniflare, in memory) with the production migrations.
import { getPlatformProxy } from 'wrangler'

const migrations = import.meta.glob<string>('../../migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const TABLES = ['nudge_log', 'snapshots', 'push_subscriptions', 'devices']

/** Statements of a migration file: comments removed, split on `;`. */
function statements(sql: string): string[] {
  return sql
    .replace(/--.*$/gm, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function startLocalD1() {
  const proxy = await getPlatformProxy<Env>({
    configPath: new URL('../../wrangler.jsonc', import.meta.url).pathname,
    persist: false,
  })
  const db = proxy.env.DB

  // In file order, like `wrangler d1 migrations apply`.
  for (const file of Object.keys(migrations).sort()) {
    await db.batch(statements(migrations[file]!).map((sql) => db.prepare(sql)))
  }

  return {
    db,
    /** Empties every table between tests (children first, for foreign keys). */
    reset: () => db.batch(TABLES.map((table) => db.prepare(`DELETE FROM ${table}`))),
    stop: () => proxy.dispose(),
  }
}
