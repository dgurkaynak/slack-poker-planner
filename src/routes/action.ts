import * as express from 'express';
import { WebClient } from '@slack/web-api';
import * as logger from '../lib/logger';
import { generate as generateId } from 'shortid';
import { to } from '../lib/to';
import { TeamStore, ITeam } from '../team/team-model';
import { SessionStore, ISession } from '../session/session-model';
import {
  SessionController,
  SessionControllerErrorCode,
} from '../session/session-controller';
import Countly from 'countly-sdk-nodejs';

export class ActionRoute {
  /**
   * POST /slack/action-endpoint
   * https://api.slack.com/interactivity/handling#payloads
   */
  static async handle(req: express.Request, res: express.Response) {
    let payload: any;

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
   * A user clicks on a vote button.
   */
  static async vote({
    payload, // action request payload
    team,
    session,
    res,
  }: {
    payload: any;
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
    payload: any;
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
    payload: any;
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
