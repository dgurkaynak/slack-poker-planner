import * as fs from 'node:fs';
import * as path from 'node:path';
import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import type { DB } from './db-types.ts';
import { logger } from './logger.ts';

let db: Kysely<DB>;

export function init() {
  if (db) {
    logger.warning({ msg: `Trying to init sqlite multiple times!` });
    return db;
  }

  logger.info({ msg: `Opening sqlite...` });
  const database = new Database(
    path.join(process.env['DATA_FOLDER'] || './', 'db.sqlite')
  );

  const version = database.prepare('SELECT sqlite_version() AS v').get() as {
    v: string;
  };
  logger.info({ msg: `Connected to SQLite`, version: version.v });

  logger.info({ msg: `Migrating sqlite...` });
  const applied = migrate(database);
  if (applied.length > 0) {
    logger.info({ msg: `Applied sqlite migrations`, applied });
  }

  db = new Kysely<DB>({ dialect: new SqliteDialect({ database }) });

  return db;
}

/**
 * Forward-only migration runner. It reads `NNN-name.sql` files and executes
 * their `-- Up` section if not applied yet.
 *
 * It's compatible with the `migrations` table and the file format of the
 * `sqlite` package, which we used before. So, existing databases continue
 * from where they left off. The `-- Down` sections are stored, but never
 * executed.
 *
 * @returns Filenames of the migrations applied in this run
 */
export function migrate(
  database: Database.Database,
  migrationsPath = path.join(process.cwd(), 'migrations')
): string[] {
  database.exec(`CREATE TABLE IF NOT EXISTS "migrations" (
  id   INTEGER PRIMARY KEY,
  name TEXT    NOT NULL,
  up   TEXT    NOT NULL,
  down TEXT    NOT NULL
)`);

  const last = database
    .prepare('SELECT MAX(id) AS id FROM migrations')
    .get() as { id: number | null };
  const lastMigrationId = last.id ?? 0;

  const pending = fs
    .readdirSync(migrationsPath)
    .flatMap((filename) => {
      const match = /^(\d+).(.*?)\.sql$/.exec(filename);
      const id = Number(match?.[1]);
      const name = match?.[2];
      return match && name ? [{ id, name, filename }] : [];
    })
    .filter((migration) => migration.id > lastMigrationId)
    .sort((a, b) => a.id - b.id);

  const insert = database.prepare(
    'INSERT INTO migrations (id, name, up, down) VALUES (?, ?, ?, ?)'
  );

  for (const migration of pending) {
    const content = fs.readFileSync(
      path.join(migrationsPath, migration.filename),
      'utf-8'
    );
    const [up = '', down = ''] = content.split(/^--\s+?down\b/im);
    const upSql = up.replace(/^-- .*?$/gm, '').trim(); // Remove comments

    database.transaction(() => {
      database.exec(upSql);
      insert.run(migration.id, migration.name, upSql, down.trim());
    })();
  }

  return pending.map((migration) => migration.filename);
}

export function getSingleton() {
  return db;
}
