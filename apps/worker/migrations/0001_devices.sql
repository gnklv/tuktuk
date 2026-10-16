-- A device is an installed copy of the app. There are no accounts: a device proves who it is
-- with a random secret token, of which only a hash is stored.
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
