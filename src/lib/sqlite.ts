import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { logger } from './logger';

let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function init() {
  if (db) {
    logger.warning({ msg: `Trying to init sqlite multiple times!` });
    return db;
  }

  logger.info({ msg: `Opening sqlite...` });
  db = await open({
    filename: path.join(process.env.DATA_FOLDER, 'db.sqlite'),
    driver: sqlite3.Database,
  });

  const version = await db.get('SELECT sqlite_version()');
  logger.info({
    msg: `Connected to SQLite`,
    version: version['sqlite_version()'],
  });

  logger.info({ msg: `Migrating sqlite...` });
  await db.migrate();

  return db;
}

export function getSingleton() {
  return db;
}
