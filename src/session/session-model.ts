import { ISession } from './isession';

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
 * Holds persisting timeout ids.
 */
const persistTimeouts: { [key: string]: number } = {};

/**
 * Updates/inserts the session. This method immediately updates in-memory
 * database. 
 */
export function upsert(session: ISession) {
  sessions[session.id] = session;
}

/**
 * Deletes the session.
 */
export async function remove(id: string) {
  delete sessions[id];
}

export function getAllSessions() {
  return sessions;
}
