import * as SessionStore from './session-model';
import { ISession } from './isession';
import chunk from 'lodash/chunk';
import map from 'lodash/map';
import groupBy from 'lodash/groupBy';
import { ITeam, TeamStore } from '../team/team-model';
import { WebClient } from '@slack/web-api';
import logger from '../lib/logger';
import Countly from 'countly-sdk-nodejs';
import getUrls from 'get-urls';

export const DEFAULT_POINTS = [
  '0',
  '0.5',
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
  MAX_TITLE_LIMIT_EXCEEDED = 'max_title_limit_exceeded',
  UNEXPECTED_PAYLOAD = 'unexpected_payload',
  INVALID_POINTS = 'invalid_points',
  SESSION_NOT_ACTIVE = 'session_not_active',
  ONLY_PARTICIPANTS_CAN_VOTE = 'only_participants_can_vote',
  INVALID_VOTING_DURATION = 'invalid_voting_duration',
}

export class SessionController {
  /**
   * Sends a message for the provided session.
   * CAUTION: Participants must resolved before using this method.
   */
  static async postMessage(session: ISession, team: ITeam) {
    const slackWebClient = new WebClient(team.access_token);

    return slackWebClient.chat.postMessage({
      channel: session.channelId,
      blocks: buildMessageBlocks(session),
      text: buildMessageText(session),
      attachments: buildMessageAttachments(session) as any,
    });
  }

  static async deleteMessage(
    team: ITeam,
    channelId: string,
    messageTs: string
  ) {
    const slackWebClient = new WebClient(team.access_token);

    return slackWebClient.chat.delete({
      ts: messageTs,
      channel: channelId,
    });
  }

  /**
   * Opens a `new session` modal
   */
  static async openModal({
    triggerId,
    team,
    channelId,
    title,
    participants,
    points,
    isProtected,
    calculateAverage,
    votingDuration,
  }: {
    triggerId: string;
    team: ITeam;
    channelId: string;
    title: string;
    participants: string[];
    points: string[];
    isProtected: boolean;
    calculateAverage: boolean;
    votingDuration: string;
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

    const averageCheckboxesOption = {
      text: {
        type: 'plain_text',
        text: 'Calculate the average (only numeric points will be used)',
        emoji: true,
      },
      value: 'average',
    } as any;

    let initialOptions = undefined;
    if (isProtected) {
      initialOptions = initialOptions || [];
      initialOptions.push(protectedCheckboxesOption);
    }
    if (calculateAverage) {
      initialOptions = initialOptions || [];
      initialOptions.push(averageCheckboxesOption);
    }

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
          text: 'Start New Session(s)',
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
              multiline: true,
              placeholder: {
                type: 'plain_text',
                text: 'Write a topic for this voting session',
                emoji: true,
              },
              initial_value: title || '',
            },
            label: {
              type: 'plain_text',
              text: 'Title',
              emoji: true,
            },
            hint: {
              type: 'plain_text',
              text:
                'You can bulk-create voting sessions, every line will correspond to a new separate session (up to 10)',
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
              initial_value: points
                .map((point) => {
                  if (!point.includes(' ')) return point;
                  if (point.includes(`"`)) return `'${point}'`;
                  return `"${point}"`;
                })
                .join(' '),
            },
            label: {
              type: 'plain_text',
              text: 'Points',
              emoji: true,
            },
            hint: {
              type: 'plain_text',
              text: 'Enter points separated by space',
              emoji: true,
            },
          },
          {
            type: 'input',
            block_id: 'votingDuration',
            element: {
              type: 'plain_text_input',
              placeholder: {
                type: 'plain_text',
                text: 'Enter a duration like: 3d 6h 30m',
                emoji: true,
              },
              initial_value: votingDuration || '',
            },
            hint: {
              type: 'plain_text',
              text: 'After voting ends, points will be reveal automatically',
              emoji: true,
            },
            label: {
              type: 'plain_text',
              text: 'Voting ends in',
              emoji: true,
            },
          },
          {
            type: 'input',
            block_id: 'other',
            optional: true,
            element: {
              type: 'checkboxes',
              options: [protectedCheckboxesOption, averageCheckboxesOption],
              initial_options: initialOptions,
            },
            label: {
              type: 'plain_text',
              text: 'Other',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text:
                '> :bulb: These options will be *remembered* the next time you create a session *on this channel*.',
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
  static async revealAndUpdateMessage(
    session: ISession,
    team: ITeam,
    userId: string
  ) {
    session.state = 'revealed';
    await SessionController.updateMessage(session, team);
    await SessionStore.remove(session.id);
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
    await SessionController.updateMessage(session, team);
    await SessionStore.remove(session.id);
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
      await SessionController.updateMessage(session, team); // do not send userId
      await SessionStore.remove(session.id);

      logger.info({
        msg: `Auto revealing votes, everyone voted`,
        sessionId: session.id,
        team: {
          id: team.id,
          name: team.name,
        },
      });

      if (process.env.COUNTLY_APP_KEY) {
        Countly.add_event({
          key: 'session_revealed_everyone_voted',
          count: 1,
          segmentation: {},
        });
      }

      return;
    }

    // Voting is still active
    await SessionController.updateMessage(session, team);
    SessionStore.upsert(session);
  }

  /**
   * Updates session message according to session state.
   */
  static async updateMessage(session: ISession, team: ITeam) {
    const slackWebClient = new WebClient(team.access_token);

    if (session.state == 'revealed') {
      await slackWebClient.chat.update({
        ts: session.rawPostMessageResponse.ts,
        channel: session.rawPostMessageResponse.channel,
        blocks: buildMessageBlocks(session),
        text: buildMessageText(session),
        attachments: buildMessageAttachments(session) as any,
      });
    } else if (session.state == 'cancelled') {
      await slackWebClient.chat.update({
        ts: session.rawPostMessageResponse.ts,
        channel: session.rawPostMessageResponse.channel,
        blocks: buildMessageBlocks(session),
        text: buildMessageText(session),
        attachments: buildMessageAttachments(session) as any,
      });
    } else {
      await slackWebClient.chat.update({
        ts: session.rawPostMessageResponse.ts,
        channel: session.rawPostMessageResponse.channel,
        blocks: buildMessageBlocks(session),
        text: buildMessageText(session),
        attachments: buildMessageAttachments(session) as any,
      });
    }
  }

  /**
   * For given votes, calculate average point
   */
  static getAverage(votes: { [key: string]: string }): string | boolean {
    const numericPoints = Object.values(votes)
      .filter(SessionController.isNumeric)
      .map(parseFloat);
    if (numericPoints.length < 1) return false;
    return (
      numericPoints.reduce((a, b) => a + b) / numericPoints.length
    ).toFixed(1);
  }

  static isNumeric(n: any) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  /**
   * For a given slack slash-command text, remove mentions
   */
  static stripMentions(text: string) {
    return text
      .replace(/<@(.*?)>/g, '')
      .replace(/<!(.*?)>/g, '')
      .replace(/\s\s+/g, ' ')
      .trim();
  }
}

/**
 * Set a interval that auto-reveals ended sessions
 */
let autoRevealEndedSessionsTimeoutId: number = setTimeout(
  autoRevealEndedSessions,
  60000
) as any;
async function autoRevealEndedSessions() {
  const now = Date.now();
  const sessions = SessionStore.getAllSessions();

  const endedSessions = Object.values(sessions).filter((session) => {
    const remainingTTL = session.endsAt - now;
    return remainingTTL <= 0;
  });

  const tasks = endedSessions.map(async (session) => {
    try {
      // If `teamId` doesn't exists in the session, just remove the session like before.
      // TODO: You can delete here after 7 days of production release
      if (typeof session.teamId !== 'string') {
        await SessionStore.remove(session.id);
        return;
      }

      logger.info({
        msg: `Auto revealing votes, session ended`,
        sessionId: session.id,
      });

      const team = await TeamStore.findById(session.teamId);

      session.state = 'revealed';
      await SessionController.updateMessage(session, team);
      await SessionStore.remove(session.id);

      if (process.env.COUNTLY_APP_KEY) {
        Countly.add_event({
          key: 'session_revealed_ended',
          count: 1,
          segmentation: {},
        });
      }
    } catch (err) {
      logger.error({
        msg: `Cannot auto-reveal an ended session, removing it...`,
        sessionId: session.id,
        err,
      });
      await SessionStore.remove(session.id);
    }
  });

  await Promise.all(tasks);

  autoRevealEndedSessionsTimeoutId = setTimeout(
    autoRevealEndedSessions,
    60000
  ) as any;
}

function buildMessageBlocks(session: ISession) {
  // In slack's `header` block, URLs are not clickable
  // Extract them and put it as a normal text
  const urlsInTitle = getUrls(session.title, { requireSchemeOrWww: true });
  const urlsText = urlsInTitle.size > 0 ? Array.from(urlsInTitle).join('\n') + '\n\n' : '';

  // Remove the URLs from title
  let title = session.title;
  urlsInTitle.forEach((url) => {
    title = title.replaceAll(url, '');
  });

  // If the title is all URLs, leave it as is
  if (title.trim().length === 0) {
    title = session.title;
  }

  if (session.state === 'active') {
    const votesText = map(session.participants.sort(), (userId) => {
      if (session.votes.hasOwnProperty(userId)) {
        return `<@${userId}>: :white_check_mark:`;
      }

      return `<@${userId}>: awaiting`;
    }).join('\n');

    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
          emoji: true,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${urlsText}${votesText}`,
          },
        ],
      },
    ];
  }

  if (session.state === 'revealed') {
    const voteGroups = groupBy(
      session.participants,
      (userId) => session.votes[userId] || 'not-voted'
    );
    const votesText = Object.keys(voteGroups)
      .sort((a, b) => session.points.indexOf(a) - session.points.indexOf(b))
      .map((point) => {
        const votes = voteGroups[point];
        const peopleText =
          votes.length == 1 ? `1 person` : `${votes.length} people`;
        const userIds = votes
          .sort()
          .map((userId) => `<@${userId}>`)
          .join(', ');

        if (point == 'not-voted') {
          return `${peopleText} *did not vote* (${userIds})`;
        }

        return `${peopleText} voted *${point}* (${userIds})`;
      })
      .join('\n');

    let averageText = '';
    if (session.average) {
      const average = SessionController.getAverage(session.votes);
      averageText = average
        ? `\nAverage: ${SessionController.getAverage(session.votes)}`
        : '';
    }

    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
          emoji: true,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${urlsText}${votesText}${averageText}`,
          },
        ],
      },
    ];
  }

  if (session.state === 'cancelled') {
    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
          emoji: true,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${urlsText}Cancelled`,
          },
        ],
      },
    ];
  }

  throw new Error(`Unknown session state: ${session.state}`);
}

function buildMessageText(session: ISession) {
  if (session.state === 'active') {
    const votesText = map(session.participants.sort(), (userId) => {
      if (session.votes.hasOwnProperty(userId)) {
        return `<@${userId}>: :white_check_mark:`;
      }

      return `<@${userId}>: awaiting`;
    }).join('\n');

    return `Title: *${session.title}*\n\nVotes:\n${votesText}`;
  }

  if (session.state === 'revealed') {
    const voteGroups = groupBy(
      session.participants,
      (userId) => session.votes[userId] || 'not-voted'
    );
    const votesText = Object.keys(voteGroups)
      .sort((a, b) => session.points.indexOf(a) - session.points.indexOf(b))
      .map((point) => {
        const votes = voteGroups[point];
        const peopleText =
          votes.length == 1 ? `1 person` : `${votes.length} people`;
        const userIds = votes
          .sort()
          .map((userId) => `<@${userId}>`)
          .join(', ');

        if (point == 'not-voted') {
          return `${peopleText} *did not vote* (${userIds})`;
        }

        return `${peopleText} voted *${point}* (${userIds})`;
      })
      .join('\n');

    let averageText = '';
    if (session.average) {
      const average = SessionController.getAverage(session.votes);
      averageText = average
        ? `\nAverage: ${SessionController.getAverage(session.votes)}`
        : '';
    }

    return `Title: *${session.title}*\n\nResult:\n${votesText}${averageText}`;
  }

  if (session.state === 'cancelled') {
    return `Title: *${session.title}* (cancelled)`;
  }

  throw new Error(`Unknown session state: ${session.state}`);
}

function buildMessageAttachments(session: ISession) {
  if (session.state === 'active') {
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

  // Session is revealed or cancelled

  // If session is in old structure, noop
  // TODO: You can delete here after 7 days of production release
  if (typeof session.votingDuration !== 'number') {
    return [];
  }

  return [
    {
      text: '',
      fallback: 'You are unable to send action',
      callback_id: `end_action:${session.id}`,
      color: '#3AA3E3',
      attachment_type: 'default',
      actions: [
        {
          name: 'action',
          text: 'Restart voting',
          type: 'button',
          value: JSON.stringify({
            b: 0, // button type, 0 => restart, 1 => delete
            vd: session.votingDuration,
            ti: session.title,
            po: session.points,
            pa: session.participants,
            pr: session.protected ? 1 : 0,
            av: session.average ? 1 : 0,
          }),
          style: 'default',
        },
        {
          name: 'action',
          text: 'Delete message',
          type: 'button',
          value: JSON.stringify({ b: 1 }), // button type, 0 => restart, 1 => delete
          style: 'danger',
        },
      ],
    },
  ];
}
