-- The last reminder sent to a device, so the next one is spaced correctly.
CREATE TABLE nudge_log (
  device_id TEXT PRIMARY KEY REFERENCES devices (id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- the user's local date of the reminder
  sent_at TEXT NOT NULL
);
