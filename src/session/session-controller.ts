import * as SessionStore from './session-model';
import { ISession } from './isession';
import chunk from 'lodash/chunk';
import map from 'lodash/map';
import groupBy from 'lodash/groupBy';
import { ITeam } from '../team/team-model';
import { WebClient } from '@slack/web-api';
import logger from '../lib/logger';
import { Trace, getSpan } from '../lib/trace-decorator';
import * as gus from '../lib/gus';

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
      text: `Title: *${session.title}*\n\nDetails:\n\n ${session.details}\n\nName: ${gus.url(session.name, session.workId)}\n\nSprint: ${session.sprint}\n\nVotes:\n${votesText}`,
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
    calculateAverage,
  }: {
    triggerId: string;
    team: ITeam;
    channelId: string;
    title: string;
    participants: string[];
    points: string[];
    isProtected: boolean;
    calculateAverage: boolean;
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

    let gusRecord: gus.IGusRecord = await gus.getRecord(title);

    await slackWebClient.views.open({
      trigger_id: triggerId,
      view: {
        callback_id: `newSessionModal:submit`,
        private_metadata: JSON.stringify({ channelId }),
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'GUS Poker Planner',
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
            block_id: 'name',
            element: {
              type: 'plain_text_input',
              initial_value: gusRecord.Name || '',
            },
            label: {
              type: 'plain_text',
              text: 'Name',
              emoji: true,
            },
          },
          {
            type: 'input',
            block_id: 'title',
            element: {
              type: 'plain_text_input',
              initial_value: gusRecord.Subject__c || '',
            },
            label: {
              type: 'plain_text',
              text: 'Title',
              emoji: true,
            },
          },
          {
            type: 'input',
            block_id: 'workId',
            element: {
              type: 'plain_text_input',
              initial_value: gusRecord.Id || '',
            },
            label: {
              type: 'plain_text',
              text: 'Work ID',
              emoji: true,
            },
          },
          {
            type: 'input',
            block_id: 'itemDetails',
            element: {
              type: 'plain_text_input',
              multiline: true,
              placeholder: {
                type: 'plain_text',
                text: 'Description of the task',
                emoji: true,
              },
              initial_value: gusRecord.Details__c || '',
            },
            label: {
              type: 'plain_text',
              text: 'Details',
              emoji: true,
            },
          },
          {
            type: 'input',
            block_id: 'sprint',
            element: {
              type: 'plain_text_input',
              placeholder: {
                type: 'plain_text',
                text: 'Sprint of the task',
                emoji: true,
              },
              initial_value: gusRecord.Sprint_Name__c || '',
            },
            label: {
              type: 'plain_text',
              text: 'Sprint',
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
              text: 'Enter points separated by space',
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
  @Trace()
  static async revealAndUpdateMessage(
    session: ISession,
    team: ITeam,
    userId: string
  ) {
    session.state = 'revealed';
    await SessionController.updateMessage(session, team, userId);
    await SessionStore.remove(session.id);
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
    await SessionStore.remove(session.id);
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
      await SessionStore.remove(session.id);
      logger.info({
        msg: `Auto revealing votes`,
        sessionId: session.id,
        team: {
          id: team.id,
          name: team.name,
        },
      });
      return;
    }

    // Voting is still active
    await SessionController.updateMessage(session, team);
    SessionStore.upsert(session);
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
      const average = SessionController.getAverage(session.votes);
      if (session.average) {
        averageText = average
          ? `\nAverage: ${average}\nAverage story points: ${gus.fib(Number(average))}`
          : '';
      }

      if (average !== null) await gus.reportStoryPoints(average, session.workId);

      await slackWebClient.chat.update({
        ts: session.rawPostMessageResponse.ts,
        channel: session.rawPostMessageResponse.channel,
        text: `Title: *${session.title}*\n\nSprint: ${session.sprint}\n\nName: ${gus.url(session.name, session.workId)}\n\nResult:\n${votesText}${averageText}`,
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
        text: `Title: *${session.title}*\n\nSprint: ${session.sprint}\n\nName: ${gus.url(session.name, session.workId)}\n\nVotes:\n${votesText}`,
        attachments: buildMessageAttachments(session) as any,
      });
    }
  }

  /**
   * For given votes, calculate average point
   */
  static getAverage(votes: { [key: string]: string }): string | null
  {
    const numericPoints = Object.values(votes)
      .filter(SessionController.isNumeric)
      .map(parseFloat);
    if (numericPoints.length < 1) return null;
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
