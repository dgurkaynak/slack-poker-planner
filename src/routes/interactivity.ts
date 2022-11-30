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
import get from 'lodash/get';
import isObject from 'lodash/isObject';
import splitSpacesExcludeQuotes from 'quoted-string-space-split';
import parseDuration from 'parse-duration';
import prettyMilliseconds from 'pretty-ms';
import {decode} from 'html-entities';

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
      logger.error({
        msg: `Unexpected interactive message callback id`,
        errorId,
        payload,
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

      return res.json({
        text:
          `Internal server error, please try again later (error code: ${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (!team) {
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
        const session = SessionStore.findById(sessionId);

        if (!session) {
          return res.json({
            text: `Ooops, could not find the session, it may be expired or cancelled`,
            response_type: 'ephemeral',
            replace_original: false,
          });
        }

        const sessionAction = payload.actions[0].value;

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
        const session = SessionStore.findById(sessionId);

        if (!session) {
          return res.json({
            text: `Ooops, could not find the session, it may be expired or cancelled`,
            response_type: 'ephemeral',
            replace_original: false,
          });
        }

        await InteractivityRoute.vote({ payload, team, session, res });
        return;
      }

      /**
       * A user clicked ended session actions button:
       * - Restart voting
       * - Delete message
       */
      case 'end_action': {
        const buttonPayloadStr = payload.actions[0].value;
        let buttonPayload: any;

        try {
          buttonPayload = JSON.parse(buttonPayloadStr);
        } catch (err) {
          const errorId = generateId();
          logger.error({
            msg: `Unexpected button payload`,
            errorId,
            buttonPayloadStr,
            payload,
          });

          res.json({
            text:
              `Unexpected button payload (error code: ${errorId})\n\n` +
              `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
            response_type: 'ephemeral',
            replace_original: false,
          });

          return;
        }

        ////////////////////
        // Restart voting //
        ////////////////////
        if (buttonPayload.b === 0) {
          const {
            vd: votingDuration,
            pa: participants,
          } = buttonPayload;

          const title = decode(buttonPayload.ti);
          const points = buttonPayload.po.map(decode);

          const session: ISession = {
            id: generateId(),
            votingDuration: votingDuration,
            endsAt: Date.now() + votingDuration,
            title,
            points,
            votes: {},
            state: 'active',
            teamId: team.id,
            channelId: payload.channel.id,
            userId: payload.user.id,
            participants,
            rawPostMessageResponse: undefined,
            protected: buttonPayload.pr === 1 ? true : false,
            average: buttonPayload.av === 1 ? true : false,
          };

          logger.info({
            msg: `Restarting session`,
            originalSessionId: sessionId,
            team: {
              id: team.id,
              name: team.name,
            },
            user: {
              id: payload.user.id,
              name: payload.user.name,
            },
            channelId: payload.channel.id,
            sessionId: session.id,
          });

          try {
            const postMessageResponse = await SessionController.postMessage(
              session,
              team
            );
            session.rawPostMessageResponse = postMessageResponse as any;

            SessionStore.upsert(session);

            res.send();

            if (process.env.COUNTLY_APP_KEY) {
              Countly.add_event({
                key: 'topic_restarted',
                count: 1,
                segmentation: {},
              });
            }
          } catch (err) {
            const errorId = generateId();
            let shouldLog = true;
            let logLevel: 'info' | 'warn' | 'error' = 'error';
            let errorMessage =
              `Internal server error, please try again later (error code: ${errorId})\n\n` +
              `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;

            const slackErrorCode = err.data && err.data.error;
            if (slackErrorCode) {
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
            } else if (
              slackErrorCode == 'method_not_supported_for_channel_type'
            ) {
              logLevel = 'info';
              errorMessage = `Poker Planner cannot be used in this type of conversations.`;
            }

            if (shouldLog) {
              logger[logLevel]({
                msg: `Could not restart session`,
                errorId,
                err,
                payload,
              });
            }

            res.json({
              text: errorMessage,
              response_type: 'ephemeral',
              replace_original: false,
            });
          }

          return;
        }
        ////////////////////
        // Delete message //
        ////////////////////
        else if (buttonPayload.b === 1) {
          logger.info({
            msg: `Deleting session message`,
            team: {
              id: team.id,
              name: team.name,
            },
            user: {
              id: payload.user.id,
              name: payload.user.name,
            },
            channelId: payload.channel.id,
            sessionId: sessionId,
          });

          try {
            await SessionController.deleteMessage(
              team,
              payload.channel.id,
              payload.message_ts
            );

            res.send();

            if (process.env.COUNTLY_APP_KEY) {
              Countly.add_event({
                key: 'topic_deleted',
                count: 1,
                segmentation: {},
              });
            }
          } catch (err) {
            const errorId = generateId();
            let errorMessage =
              `Internal server error, please try again later (error code: ${errorId})\n\n` +
              `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;

            const slackErrorCode = err.data && err.data.error;
            if (slackErrorCode) {
              errorMessage =
                `Unexpected Slack API Error: "*${slackErrorCode}*" (error code: ${errorId})\n\n` +
                `If you think this is an issue, please report to <${process.env.ISSUES_LINK}>`;
            }

            logger.error({
              msg: `Could not delete session message`,
              errorId,
              err,
              payload,
            });

            res.json({
              text: errorMessage,
              response_type: 'ephemeral',
              replace_original: false,
            });
          }

          return;
        }
        ////////////////////
        // Unknown button //
        ////////////////////
        else {
          const errorId = generateId();
          logger.error({
            msg: `Unexpected button type`,
            errorId,
            buttonPayloadStr,
            payload,
          });

          res.json({
            text:
              `Unexpected button type (error code: ${errorId})\n\n` +
              `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
            response_type: 'ephemeral',
            replace_original: false,
          });

          return;
        }

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
      logger.error({
        msg: `Could not create session, could not get the team from db`,
        errorId,
        err: teamGetErr,
        payload,
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

      return res.json({
        text: `Your Slack team (${payload.team.domain}) could not be found, please reinstall Poker Planner on <${process.env.APP_INSTALL_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    const callbackId = payload.view.callback_id;

    switch (callbackId) {
      case 'newSessionModal:submit': {
        return InteractivityRoute.submitNewSessionModal({ payload, team, res });
      }

      default: {
        const errorId = generateId();
        logger.error({
          msg: `Unexpected view-submission action callbackId`,
          errorId,
          callbackId,
          payload,
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
  static async submitNewSessionModal({
    payload, // action request payload
    team,
    res,
  }: {
    payload: IViewSubmissionActionPayload;
    team: ITeam;
    res: express.Response;
  }) {
    const errorId = generateId();

    try {
      ////////////////////////
      // Get the channel id //
      ////////////////////////
      let channelId: string;
      try {
        const privateMetadata = JSON.parse(payload.view.private_metadata);
        channelId = privateMetadata.channelId;
      } catch (err) {
        logger.error({
          msg: 'Could not create session: Cannot parse private_metadata',
          errorId,
          err,
          payload,
        });
        throw new Error(SessionControllerErrorCode.UNEXPECTED_PAYLOAD);
      }

      if (!channelId) {
        logger.error({
          msg: 'Could not create session: Missing channelId',
          errorId,
          payload,
        });
        throw new Error(SessionControllerErrorCode.UNEXPECTED_PAYLOAD);
      }

      ///////////////////////////
      // Get the session title //
      ///////////////////////////
      const titleInputState = get(payload, 'view.state.values.title');
      if (!isObject(titleInputState) || isEmpty(titleInputState)) {
        logger.error({
          msg: 'Could not create session: Title is not an object or empty',
          errorId,
          payload,
        });
        throw new Error(SessionControllerErrorCode.TITLE_REQUIRED);
      }

      const rawTitle = (titleInputState as any)[Object.keys(titleInputState)[0]]
        .value;
      if (typeof rawTitle !== 'string') {
        throw new Error(SessionControllerErrorCode.TITLE_REQUIRED);
      }

      const titles: string[] = [];
      rawTitle.split(/\r?\n/).forEach((rawLine) => {
        const trimmed = rawLine.trim();
        if (trimmed.length === 0) return;
        titles.push(trimmed);
      });

      if (titles.length === 0) {
        throw new Error(SessionControllerErrorCode.TITLE_REQUIRED);
      }

      if (titles.length > 10) {
        throw new Error(SessionControllerErrorCode.MAX_TITLE_LIMIT_EXCEEDED);
      }

      //////////////////////////
      // Get the participants //
      //////////////////////////
      const participantsInputState = get(
        payload,
        'view.state.values.participants'
      );
      if (
        !isObject(participantsInputState) ||
        isEmpty(participantsInputState)
      ) {
        logger.error({
          msg:
            'Could not create session: Participants is not an object or empty',
          errorId,
          payload,
        });
        throw new Error(SessionControllerErrorCode.NO_PARTICIPANTS);
      }
      const participants = (participantsInputState as any)[
        Object.keys(participantsInputState)[0]
      ].selected_users;

      if (participants.length == 0) {
        throw new Error(SessionControllerErrorCode.NO_PARTICIPANTS);
      }

      ////////////////////
      // Get the points //
      ////////////////////
      const pointsInputState = get(payload, 'view.state.values.points');
      if (!isObject(pointsInputState) || isEmpty(pointsInputState)) {
        logger.error({
          msg: 'Could not create session: Points is not an object or empty',
          errorId,
          payload,
        });
        throw new Error(SessionControllerErrorCode.INVALID_POINTS);
      }
      const pointsStr =
        (pointsInputState as any)[Object.keys(pointsInputState)[0]].value || '';
      let points: string[] = uniq(splitSpacesExcludeQuotes(pointsStr)) || [];

      if (points.length == 1 && points[0] == 'reset') {
        points = DEFAULT_POINTS;
      }

      if (points.length < 2 || points.length > 25) {
        throw new Error(SessionControllerErrorCode.INVALID_POINTS);
      }

      /////////////////////////////
      // Get the voting duration //
      /////////////////////////////
      const votingDurationInputState = get(
        payload,
        'view.state.values.votingDuration'
      );
      if (
        !isObject(votingDurationInputState) ||
        isEmpty(votingDurationInputState)
      ) {
        logger.error({
          msg:
            'Could not create session: Voting duration is not an object or empty',
          errorId,
          payload,
        });
        throw new Error(SessionControllerErrorCode.INVALID_VOTING_DURATION);
      }
      const votingDurationStr = (votingDurationInputState as any)[
        Object.keys(votingDurationInputState)[0]
      ].value;

      if (!votingDurationStr || votingDurationStr.trim().length == 0) {
        throw new Error(SessionControllerErrorCode.INVALID_VOTING_DURATION);
      }

      const votingDurationMs = parseDuration(votingDurationStr);
      if (typeof votingDurationMs !== 'number') {
        throw new Error(SessionControllerErrorCode.INVALID_VOTING_DURATION);
      }
      if (
        votingDurationMs < 60000 ||
        votingDurationMs > Number(process.env.MAX_VOTING_DURATION)
      ) {
        throw new Error(SessionControllerErrorCode.INVALID_VOTING_DURATION);
      }

      ////////////////////////////
      // Get "other" checkboxes //
      ////////////////////////////
      const otherCheckboxesState = get(payload, 'view.state.values.other');
      const selectedOptions =
        isObject(otherCheckboxesState) && !isEmpty(otherCheckboxesState)
          ? (otherCheckboxesState as any)[Object.keys(otherCheckboxesState)[0]]
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

      // Async tasks for slack `postMessage`
      const tasks = titles.map(async (title) => {
        // Create session struct
        const session: ISession = {
          id: generateId(),
          votingDuration: votingDurationMs,
          endsAt: Date.now() + votingDurationMs,
          title,
          points,
          votes: {},
          state: 'active',
          teamId: team.id,
          channelId,
          userId: payload.user.id,
          participants,
          rawPostMessageResponse: undefined,
          protected: isProtected,
          average: calculateAverage,
        };

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
          channelId,
          sessionId: session.id,
          bulkCount: titles.length,
        });

        const postMessageResponse = await SessionController.postMessage(
          session,
          team
        );
        session.rawPostMessageResponse = postMessageResponse as any;

        SessionStore.upsert(session);

        if (process.env.COUNTLY_APP_KEY) {
          Countly.add_event({
            key: 'topic_created',
            count: 1,
            segmentation: {
              participants: session.participants.length,
              votingDuration: votingDurationMs,
              bulkCount: titles.length,
            },
          });
        }
      });

      await Promise.all(tasks);

      res.send();

      const [upsertSettingErr] = await to(
        TeamStore.upsertSettings(team.id, channelId, {
          [ChannelSettingKey.PARTICIPANTS]: participants.join(' '),
          [ChannelSettingKey.POINTS]: points
            .map((point) => {
              if (!point.includes(' ')) return point;
              if (point.includes(`"`)) return `'${point}'`;
              return `"${point}"`;
            })
            .join(' '),
          [ChannelSettingKey.PROTECTED]: JSON.stringify(isProtected),
          [ChannelSettingKey.AVERAGE]: JSON.stringify(calculateAverage),
          [ChannelSettingKey.VOTING_DURATION]: prettyMilliseconds(
            votingDurationMs
          ),
        })
      );
      if (upsertSettingErr) {
        logger.error({
          msg: `Could not upsert settings after creating new session`,
          teamId: team.id,
          channelId,
          err: upsertSettingErr,
        });
      }
    } catch (err) {
      let shouldLog = true;
      let logLevel: 'info' | 'warn' | 'error' = 'error';
      let errorMessage =
        `Internal server error, please try again later (error code: ${errorId})\n\n` +
        `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`;
      let modalErrors: { [key: string]: string } = {};

      const slackErrorCode = err.data && err.data.error;
      if (slackErrorCode) {
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
        errorMessage = `At least one title is required`;
        modalErrors = {
          title: errorMessage,
        };
      } else if (
        err.message == SessionControllerErrorCode.MAX_TITLE_LIMIT_EXCEEDED
      ) {
        shouldLog = false;
        errorMessage = `You can bulk-create up to 10 sessions`;
        modalErrors = {
          title: errorMessage,
        };
      } else if (err.message == SessionControllerErrorCode.INVALID_POINTS) {
        shouldLog = false;
        errorMessage =
          `You must provide at least 2 poker points seperated by space, ` +
          `the maximum is 25.`;
        modalErrors = {
          points: errorMessage,
        };
      } else if (err.message == SessionControllerErrorCode.UNEXPECTED_PAYLOAD) {
        shouldLog = false;
        errorMessage =
          `Oops, Slack API sends a payload that we don't expect. Please try again.\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}> ` +
          `with following error code: ${errorId}`;
      } else if (
        err.message == SessionControllerErrorCode.INVALID_VOTING_DURATION
      ) {
        shouldLog = false;
        errorMessage = `Voting window must be between 1m and ${prettyMilliseconds(
          Number(process.env.MAX_VOTING_DURATION)
        )}`;
        modalErrors = {
          votingDuration: errorMessage,
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

      return res.json({
        text: errorMessage,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (process.env.COUNTLY_APP_KEY) {
      Countly.add_event({
        key: 'session_revealed_manual',
        count: 1,
        segmentation: {},
      });
    }

    return res.send();
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

      return res.json({
        text: errorMessage,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (process.env.COUNTLY_APP_KEY) {
      Countly.add_event({
        key: 'session_cancelled',
        count: 1,
        segmentation: {},
      });
    }

    return res.send();
  }
}
