--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
ALTER TABLE team ADD COLUMN created_at INTEGER;
ALTER TABLE team ADD COLUMN updated_at INTEGER;
ALTER TABLE channel_settings ADD COLUMN created_at INTEGER;
ALTER TABLE channel_settings ADD COLUMN updated_at INTEGER;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
ALTER TABLE team DROP COLUMN created_at;
ALTER TABLE team DROP COLUMN updated_at;
ALTER TABLE channel_settings DROP COLUMN created_at;
ALTER TABLE channel_settings DROP COLUMN updated_at;

