const logger = require('../logger');
const Team = require('../team');
const Topic = require('../topic');
const Countly = require('countly-sdk-nodejs');
const shortid = require('shortid');
const _ = require('lodash');


module.exports = async (request, reply) => {
    const cmd = request.payload;

    if (cmd.token != process.env.SLACK_VERIFICATION_TOKEN) {
        logger.error(`Could not created topic, slack verification token is invalid`, cmd);
        return {
            text: `Invalid slack verification token, please get in touch with the maintainer`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (!_.isString(cmd.text)) {
        logger.error(`Could not created topic, command.text not string`, cmd);
        return {
            text: `Topic cannot be empty`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    const firstWord = cmd.text.trim().split(' ')[0];
    switch (firstWord) {
        case 'help': {
            return {
                text: ``,
                response_type: 'ephemeral',
                replace_original: false,
                attachments: [
                    {
                        color: '#3AA3E3',
                        text: '`/pp some topic text`\n' +
                            'Starts a poker planning session on specified, ' +
                            'topic, or simply anything you typed after `/pp`. ' +
                            'This command will automatically find active (online ' +
                            'and not-away) users in the current channel/group and ' +
                            'add them as participants to poker planning session.'
                    },
                    {
                        color: '#3AA3E3',
                        text: '`/pp some topic text @user1 @user2`\n' +
                            'This command works exactly like above, however ' +
                            'specifically mentioned users will be added to the ' +
                            'session, even if they are offline. Mentions must ' +
                            'come after the topic text.'
                    },
                    {
                        color: '#3AA3E3',
                        text: '`/pp config value1 value2 ...`\n' +
                            'This command lets you customize poker values just ' +
                            'for your team. After this, all the voting sessions ' +
                            'will have just these options, until you configure ' +
                            'Poker Planner again with `/pp config` command.\n\n' +
                            'At least 2 values must be provided, seperated with ' +
                            'space character. Each value cannot be more than 20 ' +
                            'characters, and maximum 25 poker values are supported.'
                    },
                    {
                        color: '#3AA3E3',
                        text: '`/pp config reset`\n' +
                            'This command resets the poker values back to default settings.'
                    },
                ]
            }
        }

        case 'config': {
            return await configure(cmd);
        }

        default: {
            return await createTopic(cmd);
        }
    }
};


async function configure(cmd) {
    let team;

    try {
        team = await Team.get(cmd.team_id);
    } catch (err) {
        const errorId = shortid.generate();
        logger.error(`(${errorId}) Could not created topic, could not get the team from db`, cmd, err);
        return {
            text: `Internal server error, please try again later\n` +
                `SC_TEAM_GET_FAIL (${errorId})`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (!team) {
        logger.error(`Could not created topic, team could not be found`, cmd);
        return {
            text: `Your slack team "${cmd.team_domain}" could not be found, please add Poker Planner to ` +
                `your Slack team again on <https://deniz.co/slack-poker-planner>`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    const text = cmd.text.replace('config ', '');

    if (!text) {
        return {
            text: `You have to enter at least 2 poker values seperated by space`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (text == 'reset') {
        try {
            await Team.updateCustomPoints(team.id, '');
            logger.info(`[${team.name}(${team.id})] ${cmd.user_name}(${cmd.user_id}) reset custom points`);

            process.env.COUNTLY_APP_KEY && Countly.add_event({
                'key': 'reset_custom_points',
                'count': 1,
                'segmentation': {}
            });

            return `Poker planner's configuration is successfully reset to default values`;
        } catch (err) {
            const errorId = shortid.generate();
            logger.error(`(${errorId}) Could not reset custom points, db error`, cmd, err);
            return {
                text: `Internal server error, please try again later\n` +
                    `SC_RESET_FAIL (${errorId})`,
                response_type: 'ephemeral',
                replace_original: false
            };
        }
    }

    const customPointsArr = text.match(/\S+/g) || [];
    const customPoints = customPointsArr.join(' ');

    if (customPointsArr.length < 2) {
        return {
            text: `You have to enter at least 2 poker values seperated by space`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (customPointsArr.length > 25) {
        return {
            text: `Maximum 25 values are supported`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    for (let customPoint of customPointsArr) {
        if (customPoint.length > 20) {
            return {
                text: `Poker values must be under 20 characters`,
                response_type: 'ephemeral',
                replace_original: false
            };
        }
    }

    try {
        await Team.updateCustomPoints(team.id, customPoints);
        logger.info(`[${team.name}(${team.id})] ${cmd.user_name}(${cmd.user_id}) configured custom points: ${customPoints}`);

        process.env.COUNTLY_APP_KEY && Countly.add_event({
            'key': 'set_custom_points',
            'count': 1,
            'segmentation': {
                'values': customPointsArr.length
            }
        });

        return `Poker planner will use ${customPointsArr.length} poker values from now on: ${customPointsArr.join(', ')}`;
    } catch (err) {
        const errorId = shortid.generate();
        logger.error(`(${errorId}) Could not set custom points, db error`, cmd, err);
        return {
            text: `Internal server error, please try again later\n` +
                `SC_SET_FAIL (${errorId})`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }
}


async function createTopic(cmd) {
    const topic = Topic.createFromPPCommand(cmd);

    if (!topic.title) {
        return {
            text: `Topic cannot be empty`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (topic.ppCommand.channel_name == 'directmessage') {
        return {
            text: `Poker planning cannot be started in direct messages`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    let team;
    try {
        team = await Team.get(cmd.team_id);
    } catch (err) {
        const errorId = shortid.generate();
        logger.error(`(${errorId}) Could not created topic, could not get the team from db`, cmd, err);
        return {
            text: `Internal server error, please try again later\n` +
                `ST_TEAM_GET_FAIL (${errorId})`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (!team) {
        logger.error(`Could not created topic, team could not be found`, cmd);
        return {
            text: `Your slack team "${cmd.team_domain}" could not be found, please reinstall Poker Planner `
                `on <https://deniz.co/slack-poker-planner>`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    // WTF HAPI???
    setTimeout(async () => {
        try {
            logger.info(`[${team.name}(${team.id})] ${cmd.user_name}(${cmd.user_id}) trying to create ` +
                `a topic with title "${topic.title}" on #${cmd.channel_name}(${cmd.channel_id}) ` +
                `w/ ${topic.mentions.length} mention(s), id: ${topic.id}`);
            await Topic.init(topic, team);

            process.env.COUNTLY_APP_KEY && Countly.add_event({
                'key': 'topic_created',
                'count': 1,
                'segmentation': {
                    'mentions': topic.mentions.length,
                    'participants': topic.participants.length,
                }
            });

        } catch (err) {
            const errorId = shortid.generate();
            let shouldLog = true;
            let logLevel = 'error';
            let errorMessage = `Internal server error, please try again later\nST_INIT_FAIL (${errorId})`;

            // Handle `channel_not_found` error
            if (err.code == 'slackclient_platform_error' && err.data && err.data.error == 'channel_not_found') {
                logLevel = 'info';
                errorMessage = `Oops, this channel couldn't be found by Slack API. ` +
                    `This can happen when Poker Planner is installed to your Slack team by a user ` +
                    `(<@${team.user_id}>) which does not have permission to access this channel/group. ` +
                    `To fix this issue, you (or someone else who has access) can install the app again on ` +
                    `<https://deniz.co/slack-poker-planner>\n\n` +
                    `If you still having a problem, you can open an issue on <https://github.com/dgurkaynak/slack-poker-planner/issues> ` +
                    `with this error id: ${errorId}`;
            }
            // Handle `token_revoked` error
            else if (err.code == 'slackclient_platform_error' && err.data && err.data.error == 'token_revoked') {
                logLevel = 'info';
                errorMessage = `Poker Planner's access has been revoked for this workspace. ` +
                    `In order to use it, you need to install the app again on ` +
                    `<https://deniz.co/slack-poker-planner>`;
            }
            // Handle `method_not_supported_for_channel_type` error
            else if (err.code == 'slackclient_platform_error' && err.data && err.data.error == 'method_not_supported_for_channel_type') {
                logLevel = 'info';
                errorMessage = `Poker Planner cannot be used in this type of conversations.`;
            }
            // Handle `missing_scope` error
            else if (err.code == 'slackclient_platform_error' && err.data && err.data.error == 'missing_scope') {
                logLevel = 'info';

                if (err.data.needed == 'mpim:read') {
                    errorMessage = `Poker Planner does not work in multi-party direct messages.`;
                } else if (err.data.needed == 'usergroups:read') {
                    errorMessage = `You need to reinstall Poker Planner to enable user group mentions.`
                        + ` Please visit <https://deniz.co/slack-poker-planner> and click "Add to Slack" button.`;
                }
            }
            // Handle `channel_too_crowded`
            else if (err.code == 'channel_too_crowded') {
                shouldLog = false;
                errorMessage = `Poker Planner cannot be used in channels/groups which has more than 100 members. ` +
                    `You should use it in a smaller channel/group.`;
            }
            // Handle `channel_too_crowded_for_here_mention`
            else if (err.code == 'channel_too_crowded_for_here_mention') {
                shouldLog = false;
                errorMessage = 'Automatically inferring participants or `@here` mentions are not supported in ' +
                    'channels/groups which has more than 25 members. ' +
                    `You can explicitly mention users to add them as participants up to 50 people, ` +
                    `or you may want to use it in a smaller channel/group.`;
            }
            // Handle `too_many_participants`
            else if (err.code == 'too_many_participants') {
                shouldLog = false;
                errorMessage = `Maximum supported number of participants is 50.`;
            }

            shouldLog && logger[logLevel](`(${errorId}) Could not created topic`, cmd, err, topic);
            await Topic.rejectPPCommand(cmd, errorMessage);
        }
    }, 0);

    return '';
}
