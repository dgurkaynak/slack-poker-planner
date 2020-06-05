--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
CREATE TABLE channel_settings (
  team_id VARCHAR(255),
  channel_id VARCHAR(255),
  setting_key VARCHAR(255) NOT NULL,
  setting_value TEXT,
  FOREIGN KEY(team_id) REFERENCES team(id),
  UNIQUE(team_id, channel_id, setting_key)
);
CREATE INDEX idx_channel_settings ON channel_settings (team_id, channel_id);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
DROP INDEX idx_channel_settings;
DROP TABLE channel_settings;
