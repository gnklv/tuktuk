import type { LocalDate } from '@tuktuk/core'

/** A `Date` at local noon of `date`, for formatting with Intl/vue-i18n. Noon avoids DST edge cases. */
export const localDateToDate = (date: LocalDate): Date => new Date(`${date}T12:00:00`)
