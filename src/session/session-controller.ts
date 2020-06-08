import { matchAll } from '../lib/string-match-all';
import { ISession, ISessionMention, SessionStore } from './session-model';
import uniqBy from 'lodash/uniqBy';
import chunk from 'lodash/chunk';
import map from 'lodash/map';
import groupBy from 'lodash/groupBy';
import { ITeam } from '../team/team-model';
import { WebClient } from '@slack/web-api';
import * as logger from '../lib/logger';
import { Trace, getSpan } from '../lib/trace-decorator';

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
  NO_PARTICIPANTS = 'no_participants',
  TITLE_REQUIRED = 'title_required',
  INVALID_POINTS = 'invalid_points',
  SESSION_NOT_ACTIVE = 'session_not_active',
  ONLY_PARTICIPANTS_CAN_VOTE = 'only_participants_can_vote',
}

export class SessionController {
  /**
   * Sends a message for the provided session.
   * CAUTION: Participants must resolved before using this method.
   */
  @Trace()
  static async postMessage(session: ISession, team: ITeam) {
    const slackWebClient = new WebClient(team.access_token);
    const votesText = map(
      session.participants.sort(),
      (userId) => `<@${userId}>: awaiting`
    ).join('\n');

    return slackWebClient.chat.postMessage({
      channel: session.channelId,
      text: `Title: *${session.title}*\n\nVotes:\n${votesText}`,
      attachments: buildMessageAttachments(session) as any,
    });
  }

  /**
   * Opens a `new session` modal
   */
  @Trace()
  static async openModal({
    triggerId,
    team,
    channelId,
    title,
    participants,
    points,
    isProtected,
  }: {
    triggerId: string;
    team: ITeam;
    channelId: string;
    title: string;
    participants: string[];
    points: string[];
    isProtected: boolean;
  }) {
    const slackWebClient = new WebClient(team.access_token);

    const protectedCheckboxesOption = {
      text: {
        type: 'plain_text',
        text: 'Protected (prevent others to cancel or reveal this session)',
        emoji: true,
      },
      value: 'protected',
    } as any;

    await slackWebClient.views.open({
      trigger_id: triggerId,
      view: {
        callback_id: `newSessionModal:submit`,
        private_metadata: JSON.stringify({ channelId }),
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Poker Planner',
          emoji: true,
        },
        submit: {
          type: 'plain_text',
          text: 'Start New Session',
          emoji: true,
        },
        close: {
          type: 'plain_text',
          text: 'Cancel',
          emoji: true,
        },
        blocks: [
          {
            type: 'input',
            block_id: 'title',
            element: {
              type: 'plain_text_input',
              placeholder: {
                type: 'plain_text',
                text: 'Write a topic for this voting session',
                emoji: true,
              },
              initial_value: title || '',
            },
            label: {
              type: 'plain_text',
              text: 'Session Title',
              emoji: true,
            },
          },
          {
            type: 'input',
            block_id: 'participants',
            element: {
              type: 'multi_users_select',
              placeholder: {
                type: 'plain_text',
                text: 'Add users',
                emoji: true,
              },
              initial_users: participants,
              // max_selected_items: 25,
            },
            label: {
              type: 'plain_text',
              text: 'Participants',
              emoji: true,
            },
          },
          {
            type: 'input',
            block_id: 'points',
            element: {
              type: 'plain_text_input',
              placeholder: {
                type: 'plain_text',
                text: 'Change poker points',
                emoji: true,
              },
              initial_value: points.join(' ') || DEFAULT_POINTS.join(' '),
            },
            hint: {
              type: 'plain_text',
              text: 'Enter points seperated by space',
              emoji: true,
            },
            label: {
              type: 'plain_text',
              text: 'Points',
              emoji: true,
            },
          },
          {
            type: 'input',
            block_id: 'other',
            optional: true,
            element: {
              type: 'checkboxes',
              options: [protectedCheckboxesOption],
              initial_options: isProtected
                ? [protectedCheckboxesOption]
                : undefined,
            },
            label: {
              type: 'plain_text',
              text: 'Other',
              emoji: true,
            },
          },
        ],
      },
    });
  }

  /**
   * Updates the session message as revealing all the votes.
   * And clean-up the session from store.
   */
  @Trace()
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
  @Trace()
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
  @Trace()
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
      await SessionController.updateMessage(session, team); // do not send userId
      await SessionStore.delete(session.id);
      logger.info(
        `[${team.name}(${team.id})] Auto revealing votes sessionId=${session.id}`
      );
      return;
    }

    // Voting is still active
    await SessionStore.upsert(session);

    try {
      await SessionController.updateMessage(session, team);
    } catch (err) {
      logger.warn(`Could not refreshed session message after a vote, ${err}`);
    }
  }

  /**
   * Updates session message according to session state.
   */
  @Trace()
  static async updateMessage(session: ISession, team: ITeam, userId?: string) {
    const slackWebClient = new WebClient(team.access_token);

    if (session.state == 'revealed') {
      const voteGroups = groupBy(
        session.participants,
        (userId) => session.votes[userId] || 'not-voted'
      );
      const votesText = Object.keys(voteGroups)
        .sort()
        .map((point) => {
          const votes = voteGroups[point];
          const peopleText =
            votes.length == 1 ? `1 person` : `${votes.length} people`;
          const userIds = votes
            .sort()
            .map((userId) => `<@${userId}>`)
            .join(', ');

          if (point == 'not-voted') {
            return `${peopleText} *did not voted* (${userIds})`;
          }

          return `${peopleText} voted *${point}* (${userIds})`;
        })
        .join('\n');

      await slackWebClient.chat.update({
        ts: session.rawPostMessageResponse.ts,
        channel: session.rawPostMessageResponse.channel,
        text: userId
          ? `Title: *${session.title}* (revealed by <@${userId}>)\n\nResult:\n${votesText}`
          : `Title: *${session.title}*\n\nResult:\n${votesText}`,
        attachments: [],
      });
    } else if (session.state == 'cancelled') {
      await slackWebClient.chat.update({
        ts: session.rawPostMessageResponse.ts,
        channel: session.rawPostMessageResponse.channel,
        text: userId
          ? `Title: *${session.title}* (cancelled by <@${userId}>)`
          : `Title: *${session.title}* (cancelled)`,
        attachments: [],
      });
    } else {
      const votesText = map(session.participants.sort(), (userId) => {
        if (session.votes.hasOwnProperty(userId)) {
          return `<@${userId}>: :white_check_mark:`;
        }

        return `<@${userId}>: awaiting`;
      }).join('\n');

      await slackWebClient.chat.update({
        ts: session.rawPostMessageResponse.ts,
        channel: session.rawPostMessageResponse.channel,
        text: `Title: *${session.title}*\n\nVotes:\n${votesText}`,
        attachments: buildMessageAttachments(session) as any,
      });
    }
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
