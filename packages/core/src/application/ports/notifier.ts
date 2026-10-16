import type { NudgeMessage } from '../../domain/nudge-messages'

/** Delivers a reminder to the user: a system notification, a push, a Telegram message… */
export interface Notifier {
  show(message: NudgeMessage): Promise<void>
}
