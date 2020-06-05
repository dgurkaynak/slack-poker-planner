import * as express from 'express';
import { WebClient } from '@slack/web-api';
import * as logger from '../lib/logger';
import { generate as generateId } from 'shortid';
import { to } from '../lib/to';
import { TeamStore, ITeam, ChannelSettingKey } from '../team/team-model';
import { SessionStore, ISession } from '../session/session-model';
import {
  SessionController,
  SessionControllerErrorCode,
  DEFAULT_POINTS,
} from '../session/session-controller';
import Countly from 'countly-sdk-nodejs';
import isEmpty from 'lodash/isEmpty';
import {
  IInteractiveMessageActionPayload,
  IViewSubmissionActionPayload,
} from '../vendor/slack-api-interfaces';
import uniq from 'lodash/uniq';

export class ActionRoute {
  /**
   * POST /slack/action-endpoint
   * https://api.slack.com/interactivity/handling#payloads
   */
  static async handle(req: express.Request, res: express.Response) {
    let payload:
      | IInteractiveMessageActionPayload
      | IViewSubmissionActionPayload;

    try {
      payload = JSON.parse(req.body.payload);
    } catch (err) {
      const errorId = generateId();
      logger.error(`(${errorId}) Could not parse action payload`, req.body);
      return res.json({
        text: `Unexpected slack action payload (${errorId})`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (payload.token != process.env.SLACK_VERIFICATION_TOKEN) {
      logger.error(
        `Could not process action, invalid verification token`,
        payload
      );
      return res.json({
        text: `Invalid slack verification token, please get in touch with the maintainer`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    switch (payload.type) {
      case 'interactive_message': {
        await ActionRoute.interactiveMessage({ payload, res });
        return;
      }

      case 'view_submission': {
        await ActionRoute.viewSubmission({ payload, res });
        return;
      }

      default: {
        const errorId = generateId();
        logger.error(
          `(${errorId}) Unexpected action type: "${(payload as any).type}"`
        );
        return res.json({
          text: `Unexpected action type: "${
            (payload as any).type
          }" (${errorId})`,
          response_type: 'ephemeral',
          replace_original: false,
        });
      }
    }
  }

  /**
   * A user clicks on a button on message
   */
  static async interactiveMessage({
    payload, // action request payload
    res,
  }: {
    payload: IInteractiveMessageActionPayload;
    res: express.Response;
  }) {
    const parts = payload.callback_id.split(':');

    if (parts.length != 2) {
      const errorId = generateId();
      logger.error(
        `(${errorId}) Could not process action, could not parse callback_id`,
        payload
      );
      return res.json({
        text: `Could not parse callback_id "${payload.callback_id}" (${errorId})`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    const [action, sessionId] = parts;

    // Get session
    const [sessionErr, session] = await to(SessionStore.findById(sessionId));

    if (sessionErr) {
      const errorId = generateId();
      logger.error(`(${errorId}) Could not get session`, payload, sessionErr);
      return res.json({
        text:
          `Internal server error, please try again later\n` +
          `A_GET_FAIL (${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (!session) {
      return res.json({
        text: `Ooops, could not find the session, it may be expired`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    // Get team
    const [teamErr, team] = await to(TeamStore.findById(payload.team.id));

    if (teamErr) {
      const errorId = generateId();
      logger.error(`(${errorId}) Could not get team`, payload, sessionErr);
      return res.json({
        text:
          `Internal server error, please try again later\n` +
          `A_GET_FAIL (${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (!team) {
      return res.json({
        text: `Your slack team with id "${payload.team.id}" could not be found. Please try to add Poker Planner to your Slack team again.`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    switch (action) {
      /**
       * A user clicked session actions button:
       * - Reveal
       * - Cancel
       */
      case 'action': {
        const sessionAction = payload.actions[0].value;

        if (sessionAction == 'reveal') {
          await ActionRoute.revealSession({ payload, team, session, res });
        } else if (sessionAction == 'cancel') {
          await ActionRoute.cancelSession({ payload, team, session, res });
        } else {
          const errorId = generateId();
          logger.error(
            `(${errorId}) Unknown topic action "${sessionAction}"`,
            payload
          );
          res.json({
            text:
              `Internal server error, please try again later\nA_UNKNOWN_ACTION (${errorId})\n\n` +
              `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
            response_type: 'ephemeral',
            replace_original: false,
          });
        }

        return;
      }

      /**
       * A user clicked vote point button
       */
      case 'vote': {
        await ActionRoute.vote({ payload, team, session, res });
        return;
      }

      /**
       * Unexpected action
       */
      default: {
        const errorId = generateId();
        logger.error(`(${errorId}) Unexpected action: "${action}"`);
        return res.json({
          text: `Unexpected action: "${action}" (${errorId})`,
          response_type: 'ephemeral',
          replace_original: false,
        });
      }
    }
  }

  /**
   * A user clicks a submit button a view
   */
  static async viewSubmission({
    payload, // action request payload
    res,
  }: {
    payload: IViewSubmissionActionPayload;
    res: express.Response;
  }) {
    const [teamGetErr, team] = await to(TeamStore.findById(payload.team.id));
    if (teamGetErr) {
      const errorId = generateId();
      logger.error(
        `(${errorId}) Could not created topic, could not get the team from db`,
        payload,
        teamGetErr
      );
      return res.json({
        text:
          `Internal server error, please try again later\n` +
          `ST_TEAM_GET_FAIL (${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (!team) {
      logger.error(`Could not created topic, team could not be found`, payload);
      return res.json({
        text: `Your slack team "${payload.team.domain}" could not be found, please reinstall Poker Planner on <${process.env.APP_INSTALL_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    const callbackId = payload.view.callback_id;

    switch (callbackId) {
      case 'newSessionModal:submit': {
        return ActionRoute.createSession({ payload, team, res });
      }

      default: {
        const errorId = generateId();
        logger.error(
          `(${errorId}) Unexpected view-submission action callbackId: "${callbackId}"`
        );
        return res.json({
          text: `Unexpected callback-id: "${callbackId}" (${errorId})`,
          response_type: 'ephemeral',
          replace_original: false,
        });
      }
    }
  }

  /**
   * A user submits the `new session` modal.
   */
  static async createSession({
    payload, // action request payload
    team,
    res,
  }: {
    payload: IViewSubmissionActionPayload;
    team: ITeam;
    res: express.Response;
  }) {
    try {
      const privateMetadata = JSON.parse(payload.view.private_metadata);
      const titleInputState = payload.view.state.values.title as any;
      const title = titleInputState[Object.keys(titleInputState)[0]].value;

      if (!title || title.trim().length == 0) {
        throw new Error(SessionControllerErrorCode.TITLE_REQUIRED);
      }

      const participantsInputState = payload.view.state.values
        .participants as any;
      const participants =
        participantsInputState[Object.keys(participantsInputState)[0]]
          .selected_users;

      if (participants.length == 0) {
        throw new Error(SessionControllerErrorCode.NO_PARTICIPANTS);
      }

      const pointsInputState = payload.view.state.values.points as any;
      const pointsStr =
        pointsInputState[Object.keys(pointsInputState)[0]].value || '';
      const points: string[] = uniq(pointsStr.match(/\S+/g)) || [];

      if (points.length < 2 || points.length > 25) {
        throw new Error(SessionControllerErrorCode.INVALID_POINTS);
      }

      // Create session struct
      const session: ISession = {
        id: generateId(),
        title: title,
        points,
        votes: {},
        state: 'active',
        channelId: privateMetadata.channelId,
        participants,
        rawPostMessageResponse: undefined,
      };

      logger.info(
        `[${team.name}(${team.id})] ${payload.user.name}(${payload.user.id}) trying to create ` +
          `a session on #${privateMetadata.channelId} sessionId: ${session.id}`
      );

      const postMessageResponse = await SessionController.postMessage(
        session,
        team
      );
      session.rawPostMessageResponse = postMessageResponse as any;

      await SessionStore.upsert(session);

      res.send('');

      const [upsertSettingErr] = await to(
        TeamStore.upsertSettings(team.id, session.channelId, {
          [ChannelSettingKey.PARTICIPANTS]: session.participants.join(' '),
        })
      );
      if (upsertSettingErr) {
        logger.error(
          `Could not upsert settings after creating new session`,
          session,
          upsertSettingErr
        );
      }

      if (process.env.COUNTLY_APP_KEY) {
        Countly.add_event({
          key: 'topic_created',
          count: 1,
          segmentation: {
            participants: session.participants.length,
          },
        });
      }
    } catch (err) {
      const errorId = generateId();
      let shouldLog = true;
      let logLevel: 'info' | 'warn' | 'error' = 'error';
      let errorMessage =
        `Internal server error, please try again later\n` +
        `ST_INIT_FAIL (${errorId})\n\n` +
        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;
      let modalErrors: { [key: string]: string } = {};

      const slackErrorCode = err.data && err.data.error;
      if (slackErrorCode) {
        errorMessage =
          `Unexpected Slack API Error: "*${slackErrorCode}*"\n\n` +
          `If you think this is an issue, please report to <${process.env.ISSUES_LINK}> ` +
          `with this error id: ${errorId}`;
      }

      /**
       * Slack API platform errors
       */
      if (slackErrorCode == 'not_in_channel') {
        shouldLog = false;
        errorMessage =
          `Poker Planner app is not added to this channel. ` +
          `Please try again after adding it. ` +
          `You can simply add the app just by mentioning it, like "*@poker_planner*".`;
      } else if (slackErrorCode == 'channel_not_found') {
        logLevel = 'info';
        errorMessage =
          `Oops, we couldn't find this channel. ` +
          `Are you sure that Poker Planner app is added to this channel/conversation? ` +
          `You can simply add the app by mentioning it, like "*@poker_planner*". ` +
          `However this may not work in Group DMs, you need to explicitly add it as a ` +
          `member from conversation details menu. Please try again after adding it.\n\n` +
          `If you still have a problem, you can open an issue on <${process.env.ISSUES_LINK}> ` +
          `with this error id: ${errorId}`;
      } else if (slackErrorCode == 'token_revoked') {
        logLevel = 'info';
        errorMessage =
          `Poker Planner's access has been revoked for this workspace. ` +
          `In order to use it, you need to install the app again on ` +
          `<${process.env.APP_INSTALL_LINK}>`;
      } else if (slackErrorCode == 'method_not_supported_for_channel_type') {
        logLevel = 'info';
        errorMessage = `Poker Planner cannot be used in this type of conversations.`;
      } else if (slackErrorCode == 'missing_scope') {
        if (err.data.needed == 'mpim:read') {
          logLevel = 'info';
          errorMessage =
            `Poker Planner now supports Group DMs! However it requires ` +
            `additional permissions that we didn't obtained previously. You need to visit ` +
            `<${process.env.APP_INSTALL_LINK}> and reinstall the app to enable this feature.`;
        } else if (err.data.needed == 'usergroups:read') {
          logLevel = 'info';
          errorMessage =
            `Poker Planner now supports @usergroup mentions! However it requires ` +
            `additional permissions that we didn't obtained previously. You need to visit ` +
            `<${process.env.APP_INSTALL_LINK}> and reinstall the app to enable this feature.`;
        }
      } else if (
        /**
         * Internal errors
         */
        err.message == SessionControllerErrorCode.NO_PARTICIPANTS
      ) {
        shouldLog = false;
        errorMessage = `You must add at least 1 person.`;
        modalErrors = {
          participants: errorMessage,
        };
      } else if (err.message == SessionControllerErrorCode.TITLE_REQUIRED) {
        shouldLog = false;
        errorMessage = `Title is required`;
        modalErrors = {
          title: errorMessage,
        };
      } else if (err.message == SessionControllerErrorCode.INVALID_POINTS) {
        shouldLog = false;
        errorMessage = `You must provide at least 2 poker points, the maximum is 25.`;
        modalErrors = {
          points: errorMessage,
        };
      }

      if (shouldLog) {
        logger[logLevel](`(${errorId}) Could not created topic`, payload, err);
      }

      // Show the generic errors on a new modal
      if (isEmpty(modalErrors)) {
        return res.json({
          response_action: 'push',
          view: {
            type: 'modal',
            title: {
              type: 'plain_text',
              text: 'Poker Planner',
              emoji: true,
            },
            close: {
              type: 'plain_text',
              text: 'Close',
              emoji: true,
            },
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `:x: ${errorMessage}`,
                },
              },
            ],
          },
        });
      }

      // Show error on form elements
      return res.json({
        response_action: 'errors',
        errors: modalErrors,
      });
    }
  }

  /**
   * A user clicks on a vote button.
   */
  static async vote({
    payload, // action request payload
    team,
    session,
    res,
  }: {
    payload: IInteractiveMessageActionPayload;
    team: ITeam;
    session: ISession;
    res: express.Response;
  }) {
    const point = payload.actions[0].value;
    logger.info(
      `[${team.name}(${team.id})] ${payload.user.name}(${payload.user.id}) voting ` +
        `${point} points for "${session.title}" w/ id: ${session.id}`
    );
    const [voteErr] = await to(
      SessionController.vote(session, team, payload.user.id, point)
    );

    if (voteErr) {
      switch (voteErr.message) {
        case SessionControllerErrorCode.SESSION_NOT_ACTIVE: {
          return res.json({
            text: `You cannot vote revealed or cancelled topic`,
            response_type: 'ephemeral',
            replace_original: false,
          });
        }

        case SessionControllerErrorCode.ONLY_PARTICIPANTS_CAN_VOTE: {
          return res.json({
            text: `You are not a participant of that topic`,
            response_type: 'ephemeral',
            replace_original: false,
          });
        }

        // Unknown error
        default: {
          const errorId = generateId();
          logger.error(`(${errorId}) Could not vote`, voteErr);
          return res.json({
            text:
              `Internal server error, please try again later\nA_VOTE_FAIL (${errorId})\n\n` +
              `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
            response_type: 'ephemeral',
            replace_original: false,
          });
        }
      }
    }

    // Successfully voted

    if (process.env.COUNTLY_APP_KEY) {
      Countly.add_event({
        key: 'topic_voted',
        count: 1,
        segmentation: {
          points: payload.actions[0].value,
        },
      });
    }

    return res.json({
      text: `You voted ${point}`,
      response_type: 'ephemeral',
      replace_original: false,
    });
  }

  /**
   * A user clicks reveal button.
   */
  static async revealSession({
    payload, // action request payload
    team,
    session,
    res,
  }: {
    payload: IInteractiveMessageActionPayload;
    team: ITeam;
    session: ISession;
    res: express.Response;
  }) {
    logger.info(
      `[${team.name}(${team.id})] ${payload.user.name}(${payload.user.id}) revealing votes ` +
        `for "${session.title}" w/ id: ${session.id}`
    );
    const [revealErr] = await to(
      SessionController.revealAndUpdateMessage(session, team, payload.user.id)
    );

    if (revealErr) {
      const errorId = generateId();
      logger.error(`(${errorId}) Could not reveal topic`, revealErr);
      return res.json({
        text:
          `Internal server error, please try again later\n` +
          `A_REVEAL_FAIL (${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (process.env.COUNTLY_APP_KEY) {
      Countly.add_event({
        key: 'topic_revealed',
        count: 1,
        segmentation: {},
      });
    }

    return res.send('');
  }

  /**
   * A user clicks cancel button.
   */
  static async cancelSession({
    payload, // action request payload
    team,
    session,
    res,
  }: {
    payload: IInteractiveMessageActionPayload;
    team: ITeam;
    session: ISession;
    res: express.Response;
  }) {
    logger.info(
      `[${team.name}(${team.id})] ${payload.user.name}(${payload.user.id}) cancelling topic ` +
        `"${session.title}" w/ id: ${session.id}`
    );
    const [cancelErr] = await to(
      SessionController.cancelAndUpdateMessage(session, team, payload.user.id)
    );

    if (cancelErr) {
      const errorId = generateId();
      logger.error(`(${errorId}) Could not cancel topic`, cancelErr);
      return res.json({
        text:
          `Internal server error, please try again later\n` +
          `A_CANCEL_FAIL (${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (process.env.COUNTLY_APP_KEY) {
      Countly.add_event({
        key: 'topic_cancelled',
        count: 1,
        segmentation: {},
      });
    }

    return res.send('');
  }
}
