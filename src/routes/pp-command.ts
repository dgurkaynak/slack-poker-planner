import * as express from 'express';
import * as logger from '../lib/logger';
import Countly from 'countly-sdk-nodejs';
import { TeamStore, ChannelSettingKey } from '../team/team-model';
import { generate as generateId } from 'shortid';
import { to } from '../lib/to';
import isString from 'lodash/isString';
import { ISlackCommandRequestBody } from '../vendor/slack-api-interfaces';
import {
  SessionController,
  DEFAULT_POINTS,
} from '../session/session-controller';

export class PPCommandRoute {
  /**
   * POST /slack/pp-command
   */
  static async handle(req: express.Request, res: express.Response) {
    const cmd = req.body as ISlackCommandRequestBody;

    if (cmd.token != process.env.SLACK_VERIFICATION_TOKEN) {
      logger.error(
        `Could not created session, slack verification token is invalid`,
        cmd
      );
      return res.json({
        text: `Invalid slack verification token, please get in touch with the maintainer`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (!isString(cmd.text)) {
      const errorId = generateId();
      logger.error(
        `(${errorId}) Could not created session, command.text not string`,
        cmd
      );
      return res.json({
        text:
          `Unexpected command usage (error code: ${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
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
        `(${errorId}) Could not created session, could not get the team from db`,
        cmd,
        teamGetErr
      );
      return res.json({
        text:
          `Internal server error, please try again later (error code: ${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }

    if (!team) {
      logger.info(`Could not created session, team could not be found`, cmd);
      return res.json({
        text: `Your Slack team (${cmd.team_domain}) could not be found, please reinstall Poker Planner on <${process.env.APP_INSTALL_LINK}>`,
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
      // Prepare settings (participants, points...)
      const [settingsFetchErr, channelSettings] = await to(
        TeamStore.fetchSettings(team.id, cmd.channel_id)
      );
      const settings = {
        [ChannelSettingKey.PARTICIPANTS]: [] as string[],
        [ChannelSettingKey.POINTS]: DEFAULT_POINTS,
        [ChannelSettingKey.PROTECTED]: false,
      };
      if (channelSettings?.[ChannelSettingKey.PARTICIPANTS]) {
        settings[ChannelSettingKey.PARTICIPANTS] = channelSettings[
          ChannelSettingKey.PARTICIPANTS
        ].split(' ');
      }
      if (team.custom_points) {
        settings[ChannelSettingKey.POINTS] = team.custom_points.split(' ');
      }
      if (channelSettings?.[ChannelSettingKey.POINTS]) {
        settings[ChannelSettingKey.POINTS] = channelSettings[
          ChannelSettingKey.POINTS
        ].split(' ');
      }
      if (channelSettings?.[ChannelSettingKey.PROTECTED]) {
        settings[ChannelSettingKey.PROTECTED] = JSON.parse(
          channelSettings[ChannelSettingKey.PROTECTED]
        );
      }

      await SessionController.openNewSessionModal({
        triggerId: cmd.trigger_id,
        team,
        channelId: cmd.channel_id,
        title: SessionController.stripMentions(cmd.text).trim(),
        participants: settings[ChannelSettingKey.PARTICIPANTS],
        points: settings[ChannelSettingKey.POINTS],
        isProtected: settings[ChannelSettingKey.PROTECTED],
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
        text:
          `Could not open modal (error code: ${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`,
        response_type: 'ephemeral',
        replace_original: false,
      });
    }
  }

  /**
   * `/pp config ...`
   */
  static async configure(cmd: ISlackCommandRequestBody, res: express.Response) {
    return res.json({
      text:
        'This command is depracated. The session settings (points, participants, ...) ' +
        'are now persisted automatically for each channel/conversation.',
      response_type: 'ephemeral',
      replace_original: false,
    });
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
            '`/pp`\n' + 'Opens a dialog to start a new poker planning session.',
        },
        {
          color: '#3AA3E3',
          text:
            '`/pp some topic text`\n' +
            'Opens the same dialog, however title input is automatically ' +
            'filled with the value you provided.',
        },
      ],
    });
  }
}
