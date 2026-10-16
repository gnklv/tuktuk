import type { Secrets } from '../application/ports'
import { toBase64Url } from './base64url'

const toHex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')

export const webCryptoSecrets: Secrets = {
  newId: () => crypto.randomUUID(),
  newToken: () => toBase64Url(crypto.getRandomValues(new Uint8Array(32))),
  hash: async (token) =>
    toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))),
  equal: (a, b) => {
    if (a.length !== b.length) return false
    let diff = 0
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return diff === 0
  },
}
