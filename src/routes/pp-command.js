const logger = require('../logger');
const Team = require('../team');
const Topic = require('../topic');
const Countly = require('countly-sdk-nodejs');


module.exports = async (request, reply) => {
    const ppCommand = request.payload;
    const topic = Topic.createFromPPCommand(ppCommand);

    if (ppCommand.token != process.env.SLACK_VERIFICATION_TOKEN) {
        logger.error(`Could not created topic, slack verification token is invalid`, ppCommand);
        return {
            text: `Invalid slack verification token, please get in touch with the maintainer`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

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
        team = await Team.get(ppCommand.team_id);
    } catch (err) {
        logger.error(`Could not created topic, could not get the team from db, ${err}`, ppCommand);
        return {
            text: `Internal server error, please try again later`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (!team) {
        logger.error(`Could not created topic, team could not be found`, ppCommand);
        return {
            text: `Your slack team "${ppCommand.team_domain}" could not be found, please add Poker Planner app to your slack team again`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    // WTF HAPI???
    setTimeout(async () => {
        try {
            logger.info(`[${team.name}(${team.id})] ${ppCommand.user_name}(${ppCommand.user_id}) creating ` +
                `a topic with title "${topic.title}" on #${ppCommand.channel_name}(${ppCommand.channel_id}) ` +
                `w/ ${topic.mentions.length} mention(s), id: ${topic.id}`);
            await Topic.init(topic, team);

            Countly.add_event({
                'key': 'topic_created',
                'count': 1,
                'segmentation': {
                    'mentions': topic.mentions.length
                }
            });

        } catch (err) {
            logger.error(`Could not created topic, ${err}`, ppCommand);
            await Topic.rejectPPCommand(ppCommand, `Internal server error, please try again later`);
        }
    }, 0);

    return '';
};
