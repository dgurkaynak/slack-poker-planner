-- Up
CREATE TABLE team (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    access_token VARCHAR(255) NOT NULL,
    scope VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL
);
CREATE TABLE participants (
    room VARCHAR(255) PRIMARY KEY,
    id VARCHAR(255) NOT NULL,
    members TEXT);
-- Down
DROP TABLE team;
DROP TABLE participants;
