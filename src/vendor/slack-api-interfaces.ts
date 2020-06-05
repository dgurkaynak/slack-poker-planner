/**
 * Interface of Slack API command request body
 * https://api.slack.com/interactivity/slash-commands#app_command_handling
 */
export interface ISlackCommandRequestBody {
  /**
   * This is a verification token, a deprecated feature that you shouldn't
   * use any more. It was used to verify that requests were legitimately
   * being sent by Slack to your app, but you should use the signed secrets
   * functionality to do this instead.
   */
  token: string;
  /**
   * These IDs provide context about where the user was in Slack when they
   * triggered your app's command (eg. which workspace, Enterprise Grid,
   * or channel). You may need these IDs for your command response.
   *
   * The various accompanying *_name values provide you with the plain
   * text names for these IDs, but as always you should only rely on the
   * IDs as the names might change arbitrarily.
   *
   * We'll include enterprise_id and enterprise_name parameters on command
   * invocations when the executing workspace is part of an Enterprise Grid.
   */
  team_id: string;
  team_domain: string;
  enterprise_id: string;
  enterprise_name: string;
  channel_id: string;
  channel_name: string;
  /**
   * 	The ID of the user who triggered the command.
   */
  user_id: string;
  /**
   * The plain text name of the user who triggered the command. As above,
   * do not rely on this field as it is being phased out, use the
   * user_id instead.
   */
  user_name: string;
  /**
   * The command that was typed in to trigger this request.
   * This value can be useful if you want to use a single Request URL to
   * service multiple Slash Commands, as it lets you tell them apart.
   */
  command: string;
  /**
   * This is the part of the Slash Command after the command itself, and
   * it can contain absolutely anything that the user might decide to type.
   * It is common to use this text parameter to provide extra context for
   * the command.
   *
   * You can prompt users to adhere to a particular format by showing them
   * in the Usage Hint field when creating a command.
   * https://api.slack.com/interactivity/slash-commands#creating_commands
   */
  text: string;
  /**
   * A temporary webhook URL (https://api.slack.com/messaging/webhooks)
   * that you can use to generate messages responses.
   * https://api.slack.com/interactivity/handling#message_responses
   */
  response_url: string;
  /**
   * A short-lived ID that will let your app open a modal.
   * https://api.slack.com/surfaces/modals
   */
  trigger_id: string;
}

/**
 * When we use Slack's `chat.postMessage` API, this it's response.
 * https://api.slack.com/methods/chat.postMessage#response
 *
 * A sample:
 * ```json
 * {
 *   "ok": true,
 *   "channel": "C1H9RESGL",
 *   "ts": "1503435956.000247",
 *   "message": {
 *       "text": "Here's a message for you",
 *       "username": "ecto1",
 *       "bot_id": "B19LU7CSY",
 *       "attachments": [
 *           {
 *               "text": "This is an attachment",
 *               "id": 1,
 *               "fallback": "This is an attachment's fallback"
 *           }
 *       ],
 *       "type": "message",
 *       "subtype": "bot_message",
 *       "ts": "1503435956.000247"
 *   }
 * }
 * ```
 */
export interface ISlackChatPostMessageResponse {
  ok: boolean;
  channel: string;
  ts: string;
  message: {
    text: string;
    username: string;
    bot_id: string;
    attachments: any[];
    type: string;
    subtype: string;
    ts: string;
  }
}
