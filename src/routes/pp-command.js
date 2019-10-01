const logger = require('../logger');
const Team = require('../team');
const Topic = require('../topic');
const Countly = require('countly-sdk-nodejs');


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

    const firstWord = cmd.text.trim().split(' ')[0];
    switch (firstWord) {
        case 'help': {
            // TODO: Write a help text
            return 'help';
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
        logger.error(`Could not created topic, could not get the team from db, ${err}`, cmd);
        return {
            text: `Internal server error, please try again later`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (!team) {
        logger.error(`Could not created topic, team could not be found`, cmd);
        return {
            text: `Your slack team "${cmd.team_domain}" could not be found, please add Poker Planner app to your slack team again`,
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
            logger.error(`Could not reset custom points, db error, ${err}`, cmd);
            return {
                text: `Internal server error, please try again later`,
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
        logger.error(`Could not set custom points, db error, ${err}`, cmd);
        return {
            text: `Internal server error, please try again later`,
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
        logger.error(`Could not created topic, could not get the team from db, ${err}`, cmd);
        return {
            text: `Internal server error, please try again later`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (!team) {
        logger.error(`Could not created topic, team could not be found`, cmd);
        return {
            text: `Your slack team "${cmd.team_domain}" could not be found, please add Poker Planner app to your slack team again`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    // WTF HAPI???
    setTimeout(async () => {
        try {
            logger.info(`[${team.name}(${team.id})] ${cmd.user_name}(${cmd.user_id}) creating ` +
                `a topic with title "${topic.title}" on #${cmd.channel_name}(${cmd.channel_id}) ` +
                `w/ ${topic.mentions.length} mention(s), id: ${topic.id}`);
            await Topic.init(topic, team);

            process.env.COUNTLY_APP_KEY && Countly.add_event({
                'key': 'topic_created',
                'count': 1,
                'segmentation': {
                    'mentions': topic.mentions.length
                }
            });

        } catch (err) {
            logger.error(`Could not created topic, ${err}`, cmd);
            await Topic.rejectPPCommand(cmd, `Internal server error, please try again later`);
        }
    }, 0);

    return '';
}
