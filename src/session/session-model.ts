import * as redis from '../lib/redis';
import { promisify } from 'util';
import { ISession } from './isession';
import logger from '../lib/logger';
import pickBy from 'lodash/pickBy';

/**
 * Redis key stuff.
 */
function getRedisKeyMatcher() {
  return `${process.env.REDIS_NAMESPACE}:session:*`;
}

function buildRedisKey(sessionId: string) {
  return `${process.env.REDIS_NAMESPACE}:session:${sessionId}`;
}

/**
 * In memory sessions object.
 */
let sessions: { [key: string]: ISession } = {};

/**
 * Simple getter by session id.
 */
export function findById(id: string): ISession {
  return sessions[id];
}

/**
 * Restores all the sessions from redis.
 */
export async function restore(): Promise<void> {
  if (!process.env.USE_REDIS) return;

  // Scan session keys in redis
  const client = redis.getSingleton();
  const scanAsync = promisify(client.scan.bind(client));

  const keys: string[] = [];
  let cursor = '0';

  do {
    const response = await scanAsync(cursor, 'MATCH', getRedisKeyMatcher());

    cursor = response[0];
    keys.push(...response[1]);
  } while (cursor !== '0');

  // Get these keys
  if (keys.length > 0) {
    const mgetAsync = promisify(client.mget.bind(client));
    const rawSessions: string[] = await mgetAsync(keys);

    rawSessions.forEach((rawSession) => {
      if (!rawSession) return;

      try {
        const session = JSON.parse(rawSession) as ISession;
        sessions[session.id] = session;
      } catch (err) {
        // NOOP
      }
    });
  }

  logger.info({
    msg: 'Sessions restored from redis',
    count: Object.keys(sessions).length,
  });
}

/**
 * Holds persisting timeout ids.
 */
const persistTimeouts: { [key: string]: number } = {};

/**
 * Updates/inserts the session. This method immediately updates in-memory
 * database. However if redis is being used, we delay (debounce) persisting
 * of a session for 1 second.
 */
export function upsert(session: ISession) {
  sessions[session.id] = session;

  // If using redis, debounce persisting
  if (process.env.USE_REDIS) {
    if (persistTimeouts[session.id]) clearTimeout(persistTimeouts[session.id]);
    persistTimeouts[session.id] = setTimeout(
      () => persist(session.id),
      1000
    ) as any;
  }
}

/**
 * Reads a session from in-memory db, and persists to redis.
 */
async function persist(sessionId: string) {
  if (!process.env.USE_REDIS) return;

  // Immediately delete the timeout key
  delete persistTimeouts[sessionId];

  // If specified session is not in in-memory db,
  // it must be deleted, so NOOP.
  const session = sessions[sessionId];
  if (!session) return;

  // If specified session is expired, NOOP.
  // We expect that its redis record is/will-be deleted by its TTL.
  const remainingTTL = session.expiresAt - Date.now();
  if (remainingTTL <= 0) return;

  const client = redis.getSingleton();
  const setAsync = promisify(client.set.bind(client));
  try {
    await setAsync(
      buildRedisKey(session.id),
      JSON.stringify(session),
      'PX',
      remainingTTL
    );
  } catch (err) {
    logger.error({
      msg: 'Could not persist session',
      err,
      session,
      remainingTTL,
    });
  }
}

/**
 * Deletes the session.
 */
export async function remove(id: string) {
  delete sessions[id];

  if (process.env.USE_REDIS) {
    const client = redis.getSingleton();
    const delAsync = promisify(client.del.bind(client));
    await delAsync(buildRedisKey(id));
  }
}

/**
 * Set a interval that deletes expired sessions
 */
setInterval(() => {
  const now = Date.now();
  const previousSessionCount = Object.keys(sessions).length;

  sessions = pickBy(sessions, (session) => {
    const remainingTTL = session.expiresAt - now;
    return remainingTTL > 0;
  });

  const expiredSessionCount =
    previousSessionCount - Object.keys(sessions).length;

  if (expiredSessionCount > 0) {
    logger.info({
      msg: 'Cleaned up expired sessions',
      count: expiredSessionCount,
    });
  }
}, 60000);
