/**
 * Index of the plural form for Russian messages written as `'{n} день | {n} дня | {n} дней'`:
 * 1, 21, 101 → 0 · 2–4, 22–24 → 1 · 0, 5–20, 25–30, 111–114 → 2.
 */
export function russianPlural(count: number): number {
  const mod10 = Math.abs(count) % 10
  const mod100 = Math.abs(count) % 100
  if (mod10 === 1 && mod100 !== 11) return 0
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1
  return 2
}
