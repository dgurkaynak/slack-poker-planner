import * as express from 'express';
import { WebClient } from '@slack/web-api';
import * as logger from '../lib/logger';
import Countly from 'countly-sdk-nodejs';
import { TeamStore, ITeam } from '../team/team-model';
import { generate as generateId } from 'shortid';
import { to } from '../lib/to';
import isString from 'lodash/isString';
import { ISlackCommandRequestBody } from '../vendor/slack-api-interfaces';
import {
  SessionStore,
  ISession,
  ISessionMention,
} from '../session/session-model';
import {
  SessionController,
  DEFAULT_POINTS,
  SessionControllerErrorCode,
} from '../session/session-controller';
import fetch from 'node-fetch';

export class PPCommandRoute {
  /**
   * POST /slack/pp-command
   */
  static async handle(req: express.Request, res: express.Response) {
    const cmd = req.body as ISlackCommandRequestBody;

    if (cmd.token != process.env.SLACK_VERIFICATION_TOKEN) {
      logger.error(
        `Could not created topic, slack verification token is invalid`,
        cmd
      );
      return res.json({
        text: `Invalid slack verification token, please get in touch with the maintainer`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (!isString(cmd.text)) {
      logger.error(`Could not created topic, command.text not string`, cmd);
      return res.json({
        text: `Topic cannot be empty`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    const firstWord = cmd.text.trim().split(' ')[0];
    switch (firstWord) {
      case 'help': {
        return PPCommandRoute.help(res);
      }

      case 'config': {
        return await PPCommandRoute.configure(cmd, res);
      }

      default: {
        return await PPCommandRoute.createSession(cmd, res);
      }
    }
  }

  /**
   * `/pp some task name`
   */
  static async createSession(
    cmd: ISlackCommandRequestBody,
    res: express.Response
  ) {
    if (cmd.channel_name == 'directmessage') {
      return res.json({
        text: `Poker planning cannot be started in direct messages`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    const sessionTitle = SessionController.stripMentions(cmd.text);
    if (!sessionTitle) {
      return res.json({
        text: `Session title cannot be empty`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    const [teamGetErr, team] = await to(TeamStore.findById(cmd.team_id));
    if (teamGetErr) {
      const errorId = generateId();
      logger.error(
        `(${errorId}) Could not created topic, could not get the team from db`,
        cmd,
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
      logger.error(`Could not created topic, team could not be found`, cmd);
      return res.json({
        text: `Your slack team "${cmd.team_domain}" could not be found, please reinstall Poker Planner on <${process.env.APP_INSTALL_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    // If permissions are old, show migration message
    if (
      team.scope ==
      'identify,commands,channels:read,groups:read,users:read,chat:write:bot'
    ) {
      logger.info(
        `[${team.name}(${team.id})] ${cmd.user_name}(${cmd.user_id}) sees migration message`
      );
      return res.json({
        text:
          'Poker Planner has migrated to ' +
          "<https://slackhq.com/introducing-a-dramatically-upgraded-slack-app-toolkit|Slack's new app toolkit> " +
          'which adds granular permissions for better security. We now depend on bot permissions instead of ' +
          'user permissions. So that you can explicitly manage which channels/conversations Poker Planner can ' +
          'access. However, this requires a couple of changes:\n\n• In order to obtain new bot permissions ' +
          'and drop user ones, *you need to reinstall Poker Planner* to your workspace on ' +
          `<${process.env.APP_INSTALL_LINK}>\n• Before using \`/pp\` command, *Poker Planner app must be ` +
          'added to that channel/conversation*. You can simply add or invite it by just mentioning the app like ' +
          '`@poker_planner`. You can also do that from channel/converstion details menu.',
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    /**
     * From: https://api.slack.com/legacy/interactive-messages
     *
     * Responding right away
     * ---
     * You must respond within 3 seconds. If it takes your application longer
     * to process the request, we recommend responding with a HTTP 200 OK
     * immediately, then use the response_url to respond five times within
     * thirty minutes.
     *
     * Responding incrementally with response_url
     * ---
     * Use the response URL provided in the post to:
     * - Replace the current message
     * - Respond with a public message in the channel
     * - Respond with an ephemeral message in the channel that only the
     * acting user will see
     *
     * You'll be able to use a response_url five times within 30 minutes.
     * After that, it's best to move on to new messages and new interactions.
     */

    // Send acknowledgement back to API -- HTTP 200
    res.send('');

    // Create session struct
    const session: ISession = {
      id: generateId(),
      title: sessionTitle,
      points: team.custom_points
        ? team.custom_points.split(' ')
        : DEFAULT_POINTS,
      mentions: SessionController.exractMentions(cmd.text),
      votes: {},
      state: 'active',
      rawCommand: cmd,
      participants: undefined,
      rawPostMessageResponse: undefined,
    };

    try {
      logger.info(
        `[${team.name}(${team.id})] ${cmd.user_name}(${cmd.user_id}) trying to create ` +
          `a topic with title "${session.title}" on #${cmd.channel_name}(${cmd.channel_id}) ` +
          `w/ ${session.mentions.length} mention(s), id: ${session.id}`
      );

      const participants = await SessionController.resolveParticipants(
        session,
        team
      );
      session.participants = participants;

      const postMessageResponse = await SessionController.postMessage(
        session,
        team
      );
      session.rawPostMessageResponse = postMessageResponse as any;

      await SessionStore.upsert(session);

      if (process.env.COUNTLY_APP_KEY) {
        Countly.add_event({
          key: 'topic_created',
          count: 1,
          segmentation: {
            mentions: session.mentions.length,
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
        err.message ==
        SessionControllerErrorCode.CHANNEL_TOO_CROWDED_TO_FETCH_MEMBER_LIST
      ) {
        shouldLog = false;
        errorMessage =
          `Poker Planner cannot be used in channels/groups which has more than 100 members. ` +
          `You should use it in a smaller channel/group.`;
      } else if (
        err.message ==
        SessionControllerErrorCode.CHANNEL_TOO_CROWDED_FOR_USER_PRESENCE_CHECK
      ) {
        shouldLog = false;
        errorMessage =
          'Automatically inferring participants or `@here` mentions are not supported in ' +
          'channels/groups which has more than 25 members. ' +
          `You can explicitly mention users to add them as participants up to 50 people, ` +
          `or you may want to use it in a smaller channel/group.`;
      } else if (
        err.message == SessionControllerErrorCode.TOO_MANY_PARTICIPANTS
      ) {
        shouldLog = false;
        errorMessage = `Maximum supported number of participants is 50.`;
      } else if (err.message == SessionControllerErrorCode.NO_PARTICIPANTS) {
        shouldLog = false;
        errorMessage = `There are no available participants detected.`;
      }

      if (shouldLog) {
        logger[logLevel](
          `(${errorId}) Could not created topic`,
          cmd,
          err,
          session
        );
      }
      // Async reject the slash-command
      const res = await fetch(cmd.response_url, {
        method: 'post',
        body: JSON.stringify({
          text: errorMessage,
          response_type: 'ephemeral',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        logger.error(
          `Cannot async reject a slash command: ${res.status} - ${res.statusText}`,
          session
        );
      }
    } // end of the mega catch block
  }

  /**
   * `/pp config ...`
   */
  static async configure(cmd: ISlackCommandRequestBody, res: express.Response) {
    const [findErr, team] = await to(TeamStore.findById(cmd.team_id));

    if (findErr) {
      const errorId = generateId();
      logger.error(
        `(${errorId}) Could not created topic, could not get the team from db`,
        cmd,
        findErr
      );
      return res.json({
        text:
          `Internal server error, please try again later\n` +
          `SC_TEAM_GET_FAIL (${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (!team) {
      logger.error(`Could not created topic, team could not be found`, cmd);
      return res.json({
        text:
          `Your slack team "${cmd.team_domain}" could not be found, please add Poker Planner to ` +
          `your Slack team again on <${process.env.APP_INSTALL_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    // Get the text after `/pp config` part
    const text = cmd.text.replace('config ', '');

    if (!text) {
      return res.json({
        text: `You have to enter at least 2 poker values seperated by space`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    // Reset the custom points
    if (text == 'reset') {
      return PPCommandRoute.resetCustomPoints(cmd, res);
    }

    return PPCommandRoute.updateCustomPoints(cmd, res);
  }

  /**
   * `/pp config reset`
   */
  static async resetCustomPoints(
    cmd: ISlackCommandRequestBody,
    res: express.Response
  ) {
    const [updateErr] = await to(TeamStore.updateCustomPoints(cmd.team_id, ''));

    if (updateErr) {
      const errorId = generateId();
      logger.error(
        `(${errorId}) Could not reset custom points, db error`,
        cmd,
        updateErr
      );
      return res.json({
        text:
          `Internal server error, please try again later\n` +
          `SC_RESET_FAIL (${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    logger.info(
      `[${cmd.team_domain}(${cmd.team_id})] ${cmd.user_name}(${cmd.user_id}) reset custom points`
    );

    if (process.env.COUNTLY_APP_KEY) {
      Countly.add_event({
        key: 'reset_custom_points',
        count: 1,
        segmentation: {},
      });
    }

    return res.send(
      `Poker planner's configuration is successfully reset to default values`
    );
  }

  /**
   * `/pp config value1 value2 value3 ...`
   */
  static async updateCustomPoints(
    cmd: ISlackCommandRequestBody,
    res: express.Response
  ) {
    // Parse the custom points
    const text = cmd.text.replace('config ', '');
    const customPointsArr = text.match(/\S+/g) || [];
    const customPoints = customPointsArr.join(' ');

    if (customPointsArr.length < 2) {
      return res.json({
        text: `You have to enter at least 2 poker values seperated by space`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (customPointsArr.length > 25) {
      return res.json({
        text: `Maximum 25 values are supported`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    for (let customPoint of customPointsArr) {
      if (customPoint.length > 20) {
        return res.json({
          text: `Poker values must be under 20 characters`,
          response_type: 'ephemeral',
          replace_original: false,
        });
      }
    }

    // Update the custom points
    const [updateErr] = await to(
      TeamStore.updateCustomPoints(cmd.team_id, customPoints)
    );

    if (updateErr) {
      const errorId = generateId();
      logger.error(
        `(${errorId}) Could not set custom points, db error`,
        cmd,
        updateErr
      );
      return res.json({
        text:
          `Internal server error, please try again later\n` +
          `SC_SET_FAIL (${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    logger.info(
      `[${cmd.team_domain}(${cmd.team_id})] ${cmd.user_name}(${cmd.user_id}) configured custom points: ${customPoints}`
    );

    if (process.env.COUNTLY_APP_KEY) {
      Countly.add_event({
        key: 'set_custom_points',
        count: 1,
        segmentation: {
          values: customPointsArr.length,
        },
      });
    }

    return res.send(
      `Poker planner will use ${
        customPointsArr.length
      } poker values from now on: ${customPointsArr.join(', ')}`
    );
  }

  /**
   * `/pp help`
   */
  static help(res: express.Response) {
    return res.json({
      text: ``,
      response_type: 'ephemeral',
      replace_original: false,
      attachments: [
        {
          color: '#3AA3E3',
          text:
            '`/pp some topic text`\n' +
            'Starts a poker planning session on specified, ' +
            'topic, or simply anything you typed after `/pp`. ' +
            'This command will automatically find active (online ' +
            'and not-away) users in the current channel/group and ' +
            'add them as participants to poker planning session.',
        },
        {
          color: '#3AA3E3',
          text:
            '`/pp some topic text @user1 @user2`\n' +
            'This command works exactly like above, however ' +
            'specifically mentioned users will be added to the ' +
            'session, even if they are offline. Mentions must ' +
            'come after the topic text.',
        },
        {
          color: '#3AA3E3',
          text:
            '`/pp config value1 value2 ...`\n' +
            'This command lets you customize poker values just ' +
            'for your team. After this, all the voting sessions ' +
            'will have just these options, until you configure ' +
            'Poker Planner again with `/pp config` command.\n\n' +
            'At least 2 values must be provided, seperated with ' +
            'space character. Each value cannot be more than 20 ' +
            'characters, and maximum 25 poker values are supported.',
        },
        {
          color: '#3AA3E3',
          text:
            '`/pp config reset`\n' +
            'This command resets the poker values back to default settings.',
        },
      ],
    });
  }
}
