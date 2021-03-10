import { ISlackChatPostMessageResponse } from '../vendor/slack-api-interfaces';

export interface ISession {
  /**
   * Random generated session id.
   */
  id: string;
  /**
   * The timestamp of expiration.
   */
  expiresAt: number;
  /**
   * Title of the session. Mentions are excluded.
   */
  title: string;
  /**
   * Id of the GUS work item.
   */
  workId: string;
  /**
   * Details of the GUS work item.
   */
  details: string;
  /**
   * Sprint of the GUS work item.
   */
  sprint: string;
  /**
   * Name (eg: W-8989148) of the GUS work item.
   */
  name: string;
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
  /**
   * Whether to calculate the average from numeric points.
   */
  average: boolean;
}
