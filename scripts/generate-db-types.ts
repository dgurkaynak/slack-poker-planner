/**
 * Generates `src/lib/db-types.ts` from the database schema.
 *
 * It creates a temporary database, applies all the migrations, and lets
 * `kysely-codegen` introspect it. Run it via `npm run db:types` after
 * adding a new migration, and commit the result.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import Database from 'better-sqlite3';
import { migrate } from '../src/lib/sqlite.ts';

const OUT_FILE = 'src/lib/db-types.ts';

const tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-db-types-'));
const dbPath = path.join(tmpFolder, 'db.sqlite');

try {
  const database = new Database(dbPath);
  migrate(database);
  database.close();

  execFileSync(
    'kysely-codegen',
    [
      '--dialect',
      'sqlite',
      '--url',
      dbPath,
      '--exclude-pattern',
      'migrations',
      '--out-file',
      OUT_FILE,
    ],
    { stdio: 'inherit' }
  );
  execFileSync('prettier', ['--write', OUT_FILE], { stdio: 'inherit' });
} finally {
  fs.rmSync(tmpFolder, { recursive: true, force: true });
}
