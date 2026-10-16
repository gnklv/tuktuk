export interface BearerCredentials {
  readonly deviceId: string
  readonly token: string
}

/** `Authorization: Bearer <deviceId>.<token>` → its parts, or `null` if malformed. */
export function parseBearer(header: string | null): BearerCredentials | null {
  const match = /^Bearer ([\w-]+)\.([\w-]+)$/.exec(header ?? '')
  return match ? { deviceId: match[1]!, token: match[2]! } : null
}
