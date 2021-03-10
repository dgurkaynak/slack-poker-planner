import * as express from 'express';
import logger from '../lib/logger';
import { generate as generateId } from 'shortid';
import { to } from '../lib/to';
import { TeamStore, ITeam, ChannelSettingKey } from '../team/team-model';
import * as SessionStore from '../session/session-model';
import { ISession } from '../session/isession';
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
import find from 'lodash/find';
import * as opentelemetry from '@opentelemetry/api';
import { Trace, getSpan } from '../lib/trace-decorator';

export class InteractivityRoute {
  /**
   * POST /slack/action-endpoint
   * POST /slack/interactivity
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
      logger.error({
        msg: `Could not parse action payload`,
        errorId,
        body: req.body,
      });
      return res.json({
        text:
          `Unexpected slack action payload (error code: ${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (payload.token != process.env.SLACK_VERIFICATION_TOKEN) {
      logger.error({
        msg: `Could not process action, invalid verification token`,
        payload,
      });
      return res.json({
        text: `Invalid slack verification token, please get in touch with the maintainer`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    switch (payload.type) {
      case 'interactive_message': {
        await InteractivityRoute.interactiveMessage({ payload, res });
        return;
      }

      case 'view_submission': {
        await InteractivityRoute.viewSubmission({ payload, res });
        return;
      }

      default: {
        const errorId = generateId();
        logger.error({
          msg: `Unexpected interactive-message action callbackId`,
          errorId,
          payload,
        });
        return res.json({
          text:
            `Unexpected payload type (error code: ${errorId})\n\n` +
            `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
          response_type: 'ephemeral',
          replace_original: false,
        });
      }
    }
  }

  /**
   * A user clicks on a button on message
   */
  @Trace()
  static async interactiveMessage({
    payload, // action request payload
    res,
  }: {
    payload: IInteractiveMessageActionPayload;
    res: express.Response;
  }) {
    const span = getSpan();
    span?.setAttributes({
      callbackId: payload.callback_id,
      teamId: payload.team.id,
      teamDomain: payload.team.domain,
      userId: payload.user.id,
      userName: payload.user.name,
      channelId: payload.channel.id,
      channelName: payload.channel.name,
    });
    const parts = payload.callback_id.split(':');

    if (parts.length != 2) {
      const errorId = generateId();
      logger.error({
        msg: `Unexpected interactive message callback id`,
        errorId,
        payload,
      });
      span?.setAttribute('error.id', errorId);
      span?.setStatus({
        code: opentelemetry.CanonicalCode.INVALID_ARGUMENT,
        message: `Unexpected callback_id`,
      });
      return res.json({
        text:
          `Unexpected interactive message callback id (error code: ${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    const [action, sessionId] = parts;
    span?.setAttributes({ action, sessionId });

    const session = SessionStore.findById(sessionId);

    if (!session) {
      span?.setStatus({
        code: opentelemetry.CanonicalCode.NOT_FOUND,
        message: 'Session not found',
      });
      return res.json({
        text: `Ooops, could not find the session, it may be expired or cancelled`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    // Get team
    const [teamErr, team] = await to(TeamStore.findById(payload.team.id));

    if (teamErr) {
      const errorId = generateId();
      logger.error({
        msg: `Could not get team`,
        errorId,
        err: teamErr,
        payload,
      });
      span?.setAttribute('error.id', errorId);
      span?.setStatus({
        code: opentelemetry.CanonicalCode.INTERNAL,
        message: teamErr.message,
      });
      return res.json({
        text:
          `Internal server error, please try again later (error code: ${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (!team) {
      span?.setStatus({
        code: opentelemetry.CanonicalCode.NOT_FOUND,
        message: 'Team not found',
      });
      return res.json({
        text: `Your Slack team (${payload.team.domain}) could not be found, please reinstall Poker Planner on <${process.env.APP_INSTALL_LINK}>`,
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
        span?.setAttributes({ sessionAction });

        if (sessionAction == 'reveal') {
          await InteractivityRoute.revealSession({
            payload,
            team,
            session,
            res,
          });
        } else if (sessionAction == 'cancel') {
          await InteractivityRoute.cancelSession({
            payload,
            team,
            session,
            res,
          });
        } else {
          const errorId = generateId();
          logger.error({
            msg: `Unexpected action button clicked`,
            errorId,
            sessionAction,
            payload,
          });
          span?.setAttribute('error.id', errorId);
          span?.setStatus({
            code: opentelemetry.CanonicalCode.INVALID_ARGUMENT,
            message: `Unexpected session action`,
          });
          res.json({
            text:
              `Unexpected action button (error code: ${errorId})\n\n` +
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
        await InteractivityRoute.vote({ payload, team, session, res });
        return;
      }

      /**
       * Unexpected action
       */
      default: {
        const errorId = generateId();
        logger.error({
          msg: `Unexpected action`,
          errorId,
          action,
          payload,
        });
        span?.setAttribute('error.id', errorId);
        span?.setStatus({
          code: opentelemetry.CanonicalCode.INVALID_ARGUMENT,
          message: `Unexpected action`,
        });
        return res.json({
          text:
            `Unexpected action (error code: ${errorId})\n\n` +
            `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
          response_type: 'ephemeral',
          replace_original: false,
        });
      }
    }
  }

  /**
   * A user clicks a submit button a view
   */
  @Trace()
  static async viewSubmission({
    payload, // action request payload
    res,
  }: {
    payload: IViewSubmissionActionPayload;
    res: express.Response;
  }) {
    logger.info({msg: 'in viewSubmission', payload: payload});
    const span = getSpan();
    span?.setAttributes({
      teamId: payload.team.id,
      teamDomain: payload.team.domain,
      userId: payload.user.id,
      userName: payload.user.name,
    });

    const [teamGetErr, team] = await to(TeamStore.findById(payload.team.id));
    if (teamGetErr) {
      const errorId = generateId();
      logger.error({
        msg: `Could not create session, could not get the team from db`,
        errorId,
        err: teamGetErr,
        payload,
      });
      span?.setAttribute('error.id', errorId);
      span?.setStatus({
        code: opentelemetry.CanonicalCode.INTERNAL,
        message: teamGetErr.message,
      });
      return res.json({
        text:
          `Internal server error, please try again later (error code: ${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (!team) {
      logger.info({
        msg: `Could not create session, team could not be found`,
        payload,
      });
      span?.setStatus({
        code: opentelemetry.CanonicalCode.NOT_FOUND,
        message: 'Team not found',
      });
      return res.json({
        text: `Your Slack team (${payload.team.domain}) could not be found, please reinstall Poker Planner on <${process.env.APP_INSTALL_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    const callbackId = payload.view.callback_id;
    span?.setAttributes({ callbackId });

    switch (callbackId) {
      case 'newSessionModal:submit': {
        return InteractivityRoute.createSession({ payload, team, res });
      }

      default: {
        const errorId = generateId();
        logger.error({
          msg: `Unexpected view-submission action callbackId`,
          errorId,
          callbackId,
          payload,
        });
        span?.setAttribute('error.id', errorId);
        span?.setStatus({
          code: opentelemetry.CanonicalCode.INVALID_ARGUMENT,
          message: `Unexpected callback_id`,
        });
        return res.json({
          text:
            `Unexpected view-submission callback id (error code: ${errorId})\n\n` +
            `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
          response_type: 'ephemeral',
          replace_original: false,
        });
      }
    }
  }

  /**
   * A user submits the `new session` modal.
   */
  @Trace()
  static async createSession({
    payload, // action request payload
    team,
    res,
  }: {
    payload: IViewSubmissionActionPayload;
    team: ITeam;
    res: express.Response;
  }) {
    const span = getSpan();

    try {
      logger.info({msg: 'in createSession', payload: payload});
      span?.setAttributes({
        rawPrivateMetadata: payload.view.private_metadata,
      });
      const privateMetadata = JSON.parse(payload.view.private_metadata);
      const titleInputState = payload.view.state.values.title as any;
      const workIdInputState = payload.view.state.values.workId as any;
      const detailsInputState = payload.view.state.values.itemDetails as any;
      const sprintInputState = payload.view.state.values.sprint as any;
      const nameInputState = payload.view.state.values.name as any;
      const title = titleInputState[Object.keys(titleInputState)[0]].value;
      const workId = workIdInputState[Object.keys(workIdInputState)[0]].value;
      const sprint = sprintInputState[Object.keys(sprintInputState)[0]].value;
      const details = detailsInputState[Object.keys(detailsInputState)[0]].value;
      const name = nameInputState[Object.keys(nameInputState)[0]].value;

      span?.setAttributes({ title });

      if (!title || title.trim().length == 0) {
        throw new Error(SessionControllerErrorCode.TITLE_REQUIRED);
      }

      const participantsInputState = payload.view.state.values
        .participants as any;
      const participants =
        participantsInputState[Object.keys(participantsInputState)[0]]
          .selected_users;
      span?.setAttributes({ participants: participants.join(' ') });

      if (participants.length == 0) {
        throw new Error(SessionControllerErrorCode.NO_PARTICIPANTS);
      }

      const pointsInputState = payload.view.state.values.points as any;
      const pointsStr =
        pointsInputState[Object.keys(pointsInputState)[0]].value || '';
      let points: string[] = uniq(pointsStr.match(/\S+/g)) || [];
      span?.setAttributes({ points: pointsStr });

      if (points.length == 1 && points[0] == 'reset') {
        points = DEFAULT_POINTS;
      }

      if (points.length < 2 || points.length > 25) {
        throw new Error(SessionControllerErrorCode.INVALID_POINTS);
      }

      const otherCheckboxesState = payload.view.state.values.other as any;
      const selectedOptions = otherCheckboxesState
        ? otherCheckboxesState[Object.keys(otherCheckboxesState)[0]]
            .selected_options
        : [];
      const isProtected = !!find(
        selectedOptions,
        (option) => option.value == 'protected'
      );
      const calculateAverage = !!find(
        selectedOptions,
        (option) => option.value == 'average'
      );
      span?.setAttributes({ isProtected: `${isProtected}` });
      span?.setAttributes({ calculateAverage: `${calculateAverage}` });

      // Create session struct
      const session: ISession = {
        id: generateId(),
        expiresAt: Date.now() + Number(process.env.SESSION_TTL),
        title,
        workId,
        details,
        sprint,
        name,
        points,
        votes: {},
        state: 'active',
        channelId: privateMetadata.channelId,
        userId: payload.user.id,
        participants,
        rawPostMessageResponse: undefined,
        protected: isProtected,
        average: calculateAverage,
      };
      span?.setAttributes({
        sessionId: session.id,
        channelId: privateMetadata.channelId,
        userId: payload.user.id,
        userName: payload.user.name,
      });

      logger.info({
        msg: `Creating a new session`,
        team: {
          id: team.id,
          name: team.name,
        },
        user: {
          id: payload.user.id,
          name: payload.user.name,
        },
        channelId: privateMetadata.channelId,
        sessionId: session.id,
      });

      const postMessageResponse = await SessionController.postMessage(
        session,
        team
      );
      session.rawPostMessageResponse = postMessageResponse as any;

      SessionStore.upsert(session);

      res.send();

      const [upsertSettingErr] = await to(
        TeamStore.upsertSettings(team.id, session.channelId, {
          [ChannelSettingKey.PARTICIPANTS]: session.participants.join(' '),
          [ChannelSettingKey.POINTS]: session.points.join(' '),
          [ChannelSettingKey.PROTECTED]: JSON.stringify(session.protected),
          [ChannelSettingKey.AVERAGE]: JSON.stringify(session.average),
        })
      );
      if (upsertSettingErr) {
        span?.addEvent('upsert_settings_error', {
          message: upsertSettingErr.message,
        });
        logger.error({
          msg: `Could not upsert settings after creating new session`,
          session,
          err: upsertSettingErr,
        });
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
        `Internal server error, please try again later (error code: ${errorId})\n\n` +
        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;
      let modalErrors: { [key: string]: string } = {};

      const slackErrorCode = err.data && err.data.error;
      if (slackErrorCode) {
        span?.setAttributes({ slackErrorCode });
        errorMessage =
          `Unexpected Slack API Error: "*${slackErrorCode}*" (error code: ${errorId})\n\n` +
          `If you think this is an issue, please report to <${process.env.ISSUES_LINK}>`;
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
        shouldLog = false;
        errorMessage =
          `Oops, we couldn't find this channel. ` +
          `Are you sure that Poker Planner app is added to this channel/conversation? ` +
          `You can simply add the app by mentioning it, like "*@poker_planner*". ` +
          `However this may not work in Group DMs, you need to explicitly add it as a ` +
          `member from conversation details menu. Please try again after adding it.`;
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
        logger[logLevel]({
          msg: `Could not create session`,
          errorId,
          err,
          payload,
        });
      }

      span?.setAttributes({
        'error.id': errorId,
        userErrorMessage: errorMessage,
      });
      span?.setStatus({
        code: opentelemetry.CanonicalCode.UNKNOWN,
        message: err.message,
      });

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
  @Trace()
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
    const span = getSpan();
    const point = payload.actions[0].value;
    span?.setAttributes({ point });
    logger.info({
      msg: `Voting`,
      point,
      sessionId: session.id,
      team: {
        id: team.id,
        name: team.name,
      },
      user: {
        id: payload.user.id,
        name: payload.user.name,
      },
    });
    const [voteErr] = await to(
      SessionController.vote(session, team, payload.user.id, point)
    );

    if (voteErr) {
      switch (voteErr.message) {
        case SessionControllerErrorCode.SESSION_NOT_ACTIVE: {
          return res.json({
            text: `You cannot vote revealed or cancelled session`,
            response_type: 'ephemeral',
            replace_original: false,
          });
        }

        case SessionControllerErrorCode.ONLY_PARTICIPANTS_CAN_VOTE: {
          return res.json({
            text: `You are not a participant of that session`,
            response_type: 'ephemeral',
            replace_original: false,
          });
        }

        // Unknown error
        default: {
          const errorId = generateId();
          let errorMessage =
            `Internal server error, please try again later (error code: ${errorId})\n\n` +
            `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;

          const slackErrorCode = (voteErr as any)?.data?.error;
          if (slackErrorCode) {
            span?.setAttributes({ slackErrorCode });
            errorMessage =
              `Unexpected Slack API Error: "*${slackErrorCode}*", please try again later (error code: ${errorId})\n\n` +
              `If you think this is an issue, please report to <${process.env.ISSUES_LINK}>`;
          }
          if (slackErrorCode == 'channel_not_found') {
            errorMessage =
              `Unexpected Slack API Error: "*${slackErrorCode}*". Are you using Poker Planner on a shared channel? ` +
              `Shared channels are not supported due to Slack API limitations.\n\n` +
              `If you think this is an issue, please report to <${process.env.ISSUES_LINK}> with this error code: ${errorId}`;
          }

          logger.error({
            msg: `Could not vote`,
            errorId,
            err: voteErr,
            payload,
          });
          span?.setAttributes({ 'error.id': errorId });
          span?.setStatus({
            code: opentelemetry.CanonicalCode.INVALID_ARGUMENT,
            message: `Unexpected vote error`,
          });
          return res.json({
            text: errorMessage,
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

    return res.send();
  }

  /**
   * A user clicks reveal button.
   */
  @Trace()
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
    const span = getSpan();
    span?.setAttributes({
      sessionProtected: session.protected,
      sessionCreatorId: session.userId,
    });

    if (session.protected && session.userId != payload.user.id) {
      return res.json({
        text: `This session is protected, only the creator can reveal it.`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    logger.info({
      msg: `Revealing votes`,
      sessionId: session.id,
      team: {
        id: team.id,
        name: team.name,
      },
      user: {
        id: payload.user.id,
        name: payload.user.name,
      },
    });
    const [revealErr] = await to(
      SessionController.revealAndUpdateMessage(session, team, payload.user.id)
    );

    if (revealErr) {
      const errorId = generateId();
      let errorMessage =
        `Internal server error, please try again later (error code: ${errorId})\n\n` +
        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;

      const slackErrorCode = (revealErr as any)?.data?.error;
      if (slackErrorCode) {
        span?.setAttributes({ slackErrorCode });
        errorMessage =
          `Unexpected Slack API Error: "*${slackErrorCode}*", please try again later (error code: ${errorId})\n\n` +
          `If you think this is an issue, please report to <${process.env.ISSUES_LINK}>`;
      }
      if (slackErrorCode == 'channel_not_found') {
        errorMessage =
          `Unexpected Slack API Error: "*${slackErrorCode}*". Are you using Poker Planner on a shared channel? ` +
          `Shared channels are not supported due to Slack API limitations.\n\n` +
          `If you think this is an issue, please report to <${process.env.ISSUES_LINK}> with this error code: ${errorId}`;
      }

      logger.error({
        msg: `Could not reveal session`,
        errorId,
        err: revealErr,
        payload,
      });
      span?.setAttributes({ 'error.id': errorId });
      span?.setStatus({
        code: opentelemetry.CanonicalCode.INTERNAL,
        message: `Unexpected error while reveal session & update message`,
      });
      return res.json({
        text: errorMessage,
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

    return res.send();
  }

  /**
   * A user clicks cancel button.
   */
  @Trace()
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
    const span = getSpan();
    span?.setAttributes({
      sessionProtected: session.protected,
      sessionCreatorId: session.userId,
    });

    if (session.protected && session.userId != payload.user.id) {
      return res.json({
        text: `This session is protected, only the creator can cancel it.`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    logger.info({
      msg: `Cancelling session`,
      sessionId: session.id,
      team: {
        id: team.id,
        name: team.name,
      },
      user: {
        id: payload.user.id,
        name: payload.user.name,
      },
    });
    const [cancelErr] = await to(
      SessionController.cancelAndUpdateMessage(session, team, payload.user.id)
    );

    if (cancelErr) {
      const errorId = generateId();
      let errorMessage =
        `Internal server error, please try again later (error code: ${errorId})\n\n` +
        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;

      const slackErrorCode = (cancelErr as any)?.data?.error;
      if (slackErrorCode) {
        span?.setAttributes({ slackErrorCode });
        errorMessage =
          `Unexpected Slack API Error: "*${slackErrorCode}*", please try again later (error code: ${errorId})\n\n` +
          `If you think this is an issue, please report to <${process.env.ISSUES_LINK}>`;
      }
      if (slackErrorCode == 'channel_not_found') {
        errorMessage =
          `Unexpected Slack API Error: "*${slackErrorCode}*". Are you using Poker Planner on a shared channel? ` +
          `Shared channels are not supported due to Slack API limitations.\n\n` +
          `If you think this is an issue, please report to <${process.env.ISSUES_LINK}> with this error code: ${errorId}`;
      }

      logger.error({
        msg: `Could not cancel session`,
        errorId,
        err: cancelErr,
        payload,
      });
      span?.setAttributes({ 'error.id': errorId });
      span?.setStatus({
        code: opentelemetry.CanonicalCode.INTERNAL,
        message: `Unexpected error while cancel session & update message`,
      });
      return res.json({
        text: errorMessage,
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

    return res.send();
  }
}
