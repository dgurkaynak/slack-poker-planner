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

    try {
      await SessionController.openNewSessionModal({
        triggerId: cmd.trigger_id,
        team,
        channelId: cmd.channel_id,
        title: SessionController.stripMentions(cmd.text).trim(),
        participants: [],
      });

      // Send acknowledgement back to API -- HTTP 200
      res.send('');

      if (process.env.COUNTLY_APP_KEY) {
        Countly.add_event({
          key: 'new_session_modal_opened',
          count: 1,
          segmentation: {},
        });
      }
    } catch (err) {
      const errorId = generateId();
      logger.error(`(${errorId}) Could not open modal`, cmd, err);
      return res.json({
        text: `Could not open modal (${errorId})`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }
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
