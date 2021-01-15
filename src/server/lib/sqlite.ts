import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import logger from './logger';

let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function init() {
  if (db) {
    logger.warn({ msg: `Trying to init sqlite multiple times!` });
    return db;
  }

  logger.info({ msg: `Opening sqlite...` });
  db = await open({
    filename: process.env.DB_FILE,
    driver: sqlite3.Database,
  });

  logger.info({ msg: `Migrating sqlite...` });
  await db.migrate();

  return db;
}

export function getSingleton() {
  return db;
}
