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
  };
}

/**
 *
 * Sample:
 * ```json
 * {
 *   type: 'interactive_message',
 *   actions: [ { name: 'point', type: 'button', value: '3' } ],
 *   callback_id: 'vote:D-9XHLVgF',
 *   team: { id: 'T561GTB96', domain: 'pokerplanner' },
 *   channel: { id: 'C561GTCJC', name: 'general' },
 *   user: { id: 'U564FEHQ9', name: 'dgurkaynak' },
 *   action_ts: '1591362848.574075',
 *   message_ts: '1591362841.009500',
 *   attachment_id: '1',
 *   token: 'G4JhZ8If4pLcedS5QPsyiyNV',
 *   is_app_unfurl: false,
 *   original_message: {
 *     bot_id: 'BTMMWHN8K',
 *     type: 'message',
 *     text: 'Title: *deneme*\n\nVotes:\n<@U564FEHQ9>: awaiting',
 *     user: 'UTP27NNQH',
 *     ts: '1591362841.009500',
 *     team: 'T561GTB96',
 *     bot_profile: {
 *       id: 'BTMMWHN8K',
 *       deleted: false,
 *       name: '[DEV] Poker Planner',
 *       updated: 1581613927,
 *       app_id: 'AC6C6M3N1',
 *       icons: [Object],
 *       team_id: 'T561GTB96'
 *     },
 *     attachments: [ [Object], [Object], [Object], [Object] ]
 *   },
 *   response_url: 'https://hooks.slack.com/actions/T561GTB96/1165712662965/5OdlLGqF2prmoARG1IGSZafT',
 *   trigger_id: '1167091649234.176050929312.48865d594224e94e82b1042b37fd24b4'
 * }
 * ```
 */
export interface IInteractiveMessageActionPayload {
  type: 'interactive_message';
  actions: { name: string; type: string; value: string }[];
  callback_id: string;
  team: { id: string; domain: string };
  channel: { id: string; name: string };
  user: { id: string; name: string };
  action_ts: string;
  message_ts: string;
  token: string;
  response_url: string;
  trigger_id: string;
}

/**
 * Sample:
 * ```json
 * {
 *     "type": "view_submission",
 *     "team": {
 *         "id": "T561GTB96",
 *         "domain": "pokerplanner"
 *     },
 *     "user": {
 *         "id": "U564FEHQ9",
 *         "username": "dgurkaynak",
 *         "name": "dgurkaynak",
 *         "team_id": "T561GTB96"
 *     },
 *     "api_app_id": "AC6C6M3N1",
 *     "token": "G4JhZ8If4pLcedS5QPsyiyNV",
 *     "trigger_id": "1152407284295.176050929312.b8658e4c92df7fec56da770d32bf3229",
 *     "view": {
 *         "id": "V014XAJ3Q83",
 *         "team_id": "T561GTB96",
 *         "type": "modal",
 *         "blocks": [
 *             {
 *                 "type": "input",
 *                 "block_id": "title",
 *                 "label": {
 *                     "type": "plain_text",
 *                     "text": "Session Title",
 *                     "emoji": true
 *                 },
 *                 "optional": false,
 *                 "element": {
 *                     "type": "plain_text_input",
 *                     "placeholder": {
 *                         "type": "plain_text",
 *                         "text": "Write a topic for this voting session",
 *                         "emoji": true
 *                     },
 *                     "initial_value": "deneme",
 *                     "action_id": "SzXL"
 *                 }
 *             },
 *             {
 *                 "type": "input",
 *                 "block_id": "participants",
 *                 "label": {
 *                     "type": "plain_text",
 *                     "text": "Participants",
 *                     "emoji": true
 *                 },
 *                 "optional": false,
 *                 "element": {
 *                     "type": "multi_users_select",
 *                     "initial_users": [
 *                         "U564FEHQ9",
 *                         "U567DPL73",
 *                         "U567E53FT"
 *                     ],
 *                     "placeholder": {
 *                         "type": "plain_text",
 *                         "text": "Add users",
 *                         "emoji": true
 *                     },
 *                     "action_id": "7dc"
 *                 }
 *             }
 *         ],
 *         "private_metadata": "{\"channelId\":\"C561GTCJC\"}",
 *         "callback_id": "newSessionModal:submit",
 *         "state": {
 *             "values": {
 *                 "title": {
 *                     "SzXL": {
 *                         "type": "plain_text_input",
 *                         "value": "deneme"
 *                     }
 *                 },
 *                 "participants": {
 *                     "7dc": {
 *                         "type": "multi_users_select",
 *                         "selected_users": [
 *                             "U564FEHQ9",
 *                             "U567DPL73",
 *                             "U567E53FT"
 *                         ]
 *                     }
 *                 }
 *             }
 *         },
 *         "hash": "1591364280.7b14b51d",
 *         "title": {
 *             "type": "plain_text",
 *             "text": "Poker Planner",
 *             "emoji": true
 *         },
 *         "clear_on_close": false,
 *         "notify_on_close": false,
 *         "close": {
 *             "type": "plain_text",
 *             "text": "Cancel",
 *             "emoji": true
 *         },
 *         "submit": {
 *             "type": "plain_text",
 *             "text": "Start New Session",
 *             "emoji": true
 *         },
 *         "previous_view_id": null,
 *         "root_view_id": "V014XAJ3Q83",
 *         "app_id": "AC6C6M3N1",
 *         "external_id": "",
 *         "app_installed_team_id": "T561GTB96",
 *         "bot_id": "BTMMWHN8K"
 *     },
 *     "response_urls": []
 * }
 * ```
 */
export interface IViewSubmissionActionPayload {
  type: 'view_submission';
  team: { id: string; domain: string };
  user: { id: string; name: string };
  token: string;
  trigger_id: string;
  view: {
    type: 'modal';
    blocks: {
      type: string;
      block_id: string;
    }[];
    private_metadata: string;
    callback_id: string;
    state: {
      values: {
        [key: string]: {
          [key: string]:
            | {
                type: 'plain_text_input';
                value: string;
              }
            | {
                type: 'multi_users_select';
                selected_users: string[];
              };
        };
      };
    };
  };
}
