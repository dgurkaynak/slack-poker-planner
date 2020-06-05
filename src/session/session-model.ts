import {
  ISlackCommandRequestBody,
  ISlackChatPostMessageResponse,
} from '../vendor/slack-api-interfaces';
import * as logger from '../lib/logger';

export interface ISessionMention {
  type: 'user' | 'special' | 'user-group';
  id: string;
}

export interface ISession {
  /**
   * Random generated session id.
   */
  id: string;
  /**
   * Title of the session. Mentions are excluded.
   */
  title: string;
  /**
   * Slack Channel ID.
   */
  channelId: string;
  /**
   * Slack User ID who starts this session.
   */
  userId: string;
  /**
   * Poker point values.
   */
  points: string[];
  /**
   * List of User IDs resolved from used mentions.
   */
  participants: string[];
  /**
   * Votes like { U2147483697: '3', U2147483698: '2' }
   */
  votes: { [key: string]: string };
  /**
   * Session state.
   */
  state: 'active' | 'revealed' | 'cancelled';
  /**
   * The result of `chat.postMessage` that sent by our bot to
   * the channel/conversation to /pp command used in.
   */
  rawPostMessageResponse: ISlackChatPostMessageResponse;
  /**
   * Whether this session is protected, which means only the owner
   * can cancel and reveal session.
   */
  protected: boolean;
}

// In memory db for now
const sessions: { [key: string]: ISession } = {};

// Summary of active topics in every minute
let activeSessionsHash: string;
setInterval(() => {
  const ids = Object.keys(sessions);
  const hash = ids.sort().join(',');
  if (hash == activeSessionsHash) return;
  logger.info(
    ids.length == 0
      ? `There is no active session`
      : `There are ${ids.length} active session(s): ${ids.join(', ')}`
  );
  activeSessionsHash = hash;
}, 60000);

export class SessionStore {
  static async findById(id: string) {
    return sessions[id];
  }

  static async upsert(session: ISession) {
    sessions[session.id] = session;
    return session;
  }

  static async delete(id: string) {
    delete sessions[id];
  }
}
