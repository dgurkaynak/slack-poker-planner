const logger = require('../logger');
const Team = require('../team');
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

    if (!cmd.text) {
        return {
            text: `You have to enter at least 2 poker values seperated by space`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (cmd.text == 'reset') {
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

    const customPointsArr = cmd.text.match(/\S+/g) || [];
    const customPoints = customPointsArr.join(' ');

    if (customPointsArr.length < 2) {
        return {
            text: `You have to enter at least 2 poker values seperated by space`,
            response_type: 'ephemeral',
            replace_original: false
        };
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
};
