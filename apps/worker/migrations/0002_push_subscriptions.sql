-- One Web Push subscription per device. The endpoint is an opaque URL of the browser vendor's
-- push service (Apple, Google, Mozilla); keys encrypt the payload end-to-end.
CREATE TABLE push_subscriptions (
  device_id TEXT PRIMARY KEY REFERENCES devices (id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
