--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
ALTER TABLE team ADD COLUMN custom_points TEXT;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
-- SQLite does not support deleting column, we need to create a new table, copy the data and drop old tabke
-- https://stackoverflow.com/questions/5938048/delete-column-from-sqlite-table/5987838#5987838
BEGIN TRANSACTION;
CREATE TEMPORARY TABLE team_backup(id, name, access_token, scope, user_id);
INSERT INTO team_backup SELECT id, name, access_token, scope, user_id FROM team;
DROP TABLE team;
CREATE TABLE team (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  access_token VARCHAR(255) NOT NULL,
  scope VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL
);
INSERT INTO team SELECT id, name, access_token, scope, user_id FROM team_backup;
DROP TABLE team_backup;
COMMIT;
