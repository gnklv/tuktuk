import type { DeviceCredentials } from './push-server-client'

const KEY = 'tuktuk:v1:device'

/** This device's id and secret token for the push server, kept in localStorage. */
export class DeviceCredentialsStore {
  constructor(private readonly storage: Storage) {}

  get(): DeviceCredentials | null {
    try {
      const value = JSON.parse(this.storage.getItem(KEY) ?? 'null') as Partial<DeviceCredentials>
      return typeof value?.deviceId === 'string' && typeof value.token === 'string'
        ? { deviceId: value.deviceId, token: value.token }
        : null
    } catch {
      return null
    }
  }

  save(credentials: DeviceCredentials): void {
    this.storage.setItem(KEY, JSON.stringify(credentials))
  }

  clear(): void {
    this.storage.removeItem(KEY)
  }
}
