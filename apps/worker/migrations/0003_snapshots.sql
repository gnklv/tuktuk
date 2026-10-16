-- The latest reminder snapshot of a device: settings and task counts for the coming days,
-- as JSON (see ReminderSnapshot in @tuktuk/core). No task titles.
CREATE TABLE snapshots (
  device_id TEXT PRIMARY KEY REFERENCES devices (id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
