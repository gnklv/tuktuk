import type { Locale } from '@tuktuk/core'
import { en, type MessageSchema } from './en'
import { ru } from './ru'

export type { MessageSchema }

/** All dictionaries. Adding a locale to core's `LOCALES` without a dictionary is a type error. */
export const messages: Record<Locale, MessageSchema> = { en, ru }
