// The only place with user-facing text: UI strings and reminder wording, for every locale.
// Used by the web app (through vue-i18n) and by the push server.
import type { Locale } from '@tuktuk/core'

export { messages, type MessageSchema } from './messages'
export { nudgeCopy, formatDuration } from './nudge-copy'
export { russianPlural } from './plural'

/** Each language's own name, shown in the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
}
