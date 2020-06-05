import { matchAll } from '../lib/string-match-all';
import { ISession, ISessionMention, SessionStore } from './session-model';
import some from 'lodash/some';
import uniqBy from 'lodash/uniqBy';
import uniq from 'lodash/uniq';
import chunk from 'lodash/chunk';
import map from 'lodash/map';
import { ITeam } from '../team/team-model';
import { WebClient } from '@slack/web-api';
import * as logger from '../lib/logger';

export const DEFAULT_POINTS = [
  '0',
  '1/2',
  '1',
  '2',
  '3',
  '5',
  '8',
  '13',
  '20',
  '40',
  '100',
  '∞',
  '?',
];

export enum SessionControllerErrorCode {
  CHANNEL_TOO_CROWDED_TO_FETCH_MEMBER_LIST = 'channel_too_crowded_to_fetch_member_list',
  CHANNEL_TOO_CROWDED_FOR_USER_PRESENCE_CHECK = 'channel_too_crowded_for_user_presence_check',
  TOO_MANY_PARTICIPANTS = 'too_many_participants',
  NO_PARTICIPANTS = 'no_participants',
  SESSION_NOT_ACTIVE = 'session_not_active',
  ONLY_PARTICIPANTS_CAN_VOTE = 'only_participants_can_vote',
}

export class SessionController {
  /**
   * Sends a message for the provided session.
   * CAUTION: Participants must resolved before using this method.
   */
  static async postMessage(session: ISession, team: ITeam) {
    const slackWebClient = new WebClient(team.access_token);
    return slackWebClient.chat.postMessage({
      channel: session.rawCommand.channel_id,
      text:
        `Please vote the topic: *"${session.title}"* \nParticipants: ` +
        `${session.participants.map((userId) => `<@${userId}>`).join(' ')}`,
      attachments: buildMessageAttachments(session) as any,
    });
  }

  /**
   * Updates the session message as revealing all the votes.
   * And clean-up the session from store.
   */
  static async revealAndUpdateMessage(
    session: ISession,
    team: ITeam,
    userId: string
  ) {
    session.state = 'revealed';
    await SessionController.updateMessage(session, team, userId);
    await SessionStore.delete(session.id);
  }

  /**
   * Updates the session message as cancelled.
   * And clean-up the session from store.
   */
  static async cancelAndUpdateMessage(
    session: ISession,
    team: ITeam,
    userId: string
  ) {
    session.state = 'cancelled';
    await SessionController.updateMessage(session, team, userId);
    await SessionStore.delete(session.id);
  }

  /**
   *
   */
  static async vote(
    session: ISession,
    team: ITeam,
    userId: string,
    point: string
  ) {
    if (session.state != 'active') {
      throw new Error(SessionControllerErrorCode.SESSION_NOT_ACTIVE);
    }

    if (session.participants.indexOf(userId) == -1) {
      throw new Error(SessionControllerErrorCode.ONLY_PARTICIPANTS_CAN_VOTE);
    }

    session.votes[userId] = point;
    session.state =
      Object.keys(session.votes).length == session.participants.length
        ? 'revealed'
        : 'active';

    if (session.state == 'revealed') {
      await SessionController.revealAndUpdateMessage(session, team, userId);
      logger.info(
        `[${team.name}(${team.id})] Auto revealing votes ` +
          `for "${session.title}" w/ id: ${session.id}`
      );
      return;
    }

    // Voting is still active
    await SessionStore.upsert(session);

    try {
      await SessionController.updateMessage(session, team);
    } catch (err) {
      logger.warn(`Could not refreshed topic after a vote, ${err}`);
    }
  }

  /**
   * Updates session message according to session state.
   */
  static async updateMessage(
    session: ISession,
    team: ITeam,
    userId?: string
  ) {
    const slackWebClient = new WebClient(team.access_token);

    if (session.state == 'revealed') {
      const votesText = map(session.votes, (point, userId) => `<@${userId}>: *${point}*\n`)
        .join('')
        .trim() || 'No votes';

      await slackWebClient.chat.update({
        ts: session.rawPostMessageResponse.ts,
        channel: session.rawPostMessageResponse.channel,
        text: userId
          ? `Votes for the topic *"${session.title}"*: (revealed by <@${userId}>)\n${votesText}`
          : `Votes for topic *"${session.title}"*: \n${votesText}`,
        attachments: [],
      });
    } else if (session.state == 'cancelled') {
      await slackWebClient.chat.update({
        ts: session.rawPostMessageResponse.ts,
        channel: session.rawPostMessageResponse.channel,
        text: userId
          ? `Cancelled topic *"${session.title}"* by <@${userId}>`
          : `Cancelled topic *"${session.title}"*`,
        attachments: [],
      });
    } else {
      await slackWebClient.chat.update({
        ts: session.rawPostMessageResponse.ts,
        channel: session.rawPostMessageResponse.channel,
        text:
          `Please vote the topic: *"${session.title}"* \nParticipants: ` +
          `${session.participants
            .map((userId) => {
              // Strikethrough voted participants
              const s = session.votes.hasOwnProperty(userId) ? '~' : '';
              return `${s}<@${userId}>${s}`;
            })
            .join(' ')}`,
        attachments: buildMessageAttachments(session) as any,
      });
    }
  }

  /**
   * Resolves all the mentions like `@here @channel @user1 @user @usergroup `
   * into actual user ids.
   */
  static async resolveParticipants(session: ISession, team: ITeam) {
    let participantIds: string[] = [];
    const slackWebClient = new WebClient(team.access_token);

    // If there is no mention, must be work like @here
    const mentions =
      session.mentions.length > 0
        ? session.mentions
        : [{ type: 'special', id: 'here' }];

    // If @here or @channel mention is used, we need to fetch current channel members
    let channelMemberIds: string[] = [];
    const shouldFetchChannelMembers = some(mentions, (mention) => {
      return (
        mention.type == 'special' &&
        ['channel', 'here'].indexOf(mention.id) > -1
      );
    });

    if (shouldFetchChannelMembers) {
      const res = await slackWebClient.conversations.members({
        channel: session.rawCommand.channel_id,
        limit: 100,
      });
      channelMemberIds = res.members as string[];

      if (channelMemberIds.length >= 100 || res.response_metadata.next_cursor) {
        throw new Error(
          SessionControllerErrorCode.CHANNEL_TOO_CROWDED_TO_FETCH_MEMBER_LIST
        );
      }
    }

    // For each mention
    for (let mention of mentions) {
      if (mention.type == 'special') {
        // @channel mention
        if (mention.id == 'channel') {
          participantIds.push(...channelMemberIds);
        } else if (mention.id == 'here') {
          // @here mention

          if (channelMemberIds.length > 25) {
            const err = new Error(
              SessionControllerErrorCode.CHANNEL_TOO_CROWDED_FOR_USER_PRESENCE_CHECK
            );
            throw err;
          }

          // Gracefully check user presence
          const presenceTasks = channelMemberIds.map((id) =>
            slackWebClient.users.getPresence({ user: id }).catch(() => {})
          );
          const presences = await Promise.all(presenceTasks);
          const channelActiveMemberIds = channelMemberIds.filter(
            (id, index) => {
              if (!presences[index]) return false;
              return (presences[index] as any).presence == 'active';
            }
          );
          participantIds.push(...channelActiveMemberIds);
        }
      } else if (mention.type == 'user') {
        // @user mentions
        participantIds.push(mention.id);
      } else if (mention.type == 'user-group') {
        const res: any = await slackWebClient.usergroups.users.list({
          usergroup: mention.id,
        });

        participantIds.push(...res.users);
      }
    }

    // Remove duplicates
    participantIds = uniq(participantIds);

    if (participantIds.length > 50) {
      throw new Error(SessionControllerErrorCode.TOO_MANY_PARTICIPANTS);
    }

    if (participantIds.length == 0) {
      throw new Error(SessionControllerErrorCode.NO_PARTICIPANTS);
    }

    return participantIds;
  }

  /**
   * For a given slack slash-command text, extract mentions
   */
  static exractMentions(text: string) {
    const allMentions: ISessionMention[] = [];

    // User mentions
    matchAll(text, /<@(.*?)>/g).forEach((str) => {
      allMentions.push({ type: 'user', id: str.split('|')[0] });
    });

    // Group mentions
    matchAll(text, /<!(.*?)>/g).forEach((str) => {
      const specialMentions = ['everyone', 'channel', 'here'];
      if (specialMentions.indexOf(str) > -1) {
        allMentions.push({ type: 'special', id: str });
      } else if (str.includes('subteam')) {
        // Custom user group mentions
        const [id, name] = str.replace('subteam^', '').split('|');

        allMentions.push({
          type: 'user-group',
          id,
        });
      }
    });

    // Remove duplicate mentions
    return uniqBy(allMentions, (mention) => `${mention.type}-${mention.id}`);
  }

  /**
   * For a given slack slash-command text, extract mentions
   */
  static stripMentions(text: string) {
    return text
      .replace(/<@(.*?)>/g, '')
      .replace(/<!(.*?)>/g, '')
      .replace(/\s\s+/g, ' ')
      .trim();
  }
}

export function buildMessageAttachments(session: ISession) {
  const pointAttachments = chunk(session.points, 5).map((points) => {
    return {
      text: '',
      fallback: 'You are unable to vote',
      callback_id: `vote:${session.id}`,
      color: '#3AA3E3',
      attachment_type: 'default',
      actions: points.map((point) => ({
        name: 'point',
        text: point,
        type: 'button',
        value: point,
      })),
    };
  });

  return [
    ...pointAttachments,
    {
      text: 'Actions',
      fallback: 'You are unable to send action',
      callback_id: `action:${session.id}`,
      color: '#3AA3E3',
      attachment_type: 'default',
      actions: [
        {
          name: 'action',
          text: 'Reveal',
          type: 'button',
          value: 'reveal',
          style: 'danger',
        },
        {
          name: 'action',
          text: 'Cancel',
          type: 'button',
          value: 'cancel',
          style: 'danger',
        },
      ],
    },
  ];
}
