const logger = require('../logger');
const Team = require('../team');
const Topic = require('../topic');
const Countly = require('countly-sdk-nodejs');
const shortid = require('shortid');


module.exports = async (request, reply) => {
    const payload = JSON.parse(request.payload.payload);
    const parts = payload.callback_id.split('_');

    if (payload.token != process.env.SLACK_VERIFICATION_TOKEN) {
        logger.error(`Could not process action, invalid verification token`, payload);
        return {
            text: `Invalid slack verification token, please get in touch with the maintainer`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (parts.length != 2) {
        logger.error(`Could not process action, could not parse callback_id`, payload);
        return {
            text: `Could not parse callback_id "${payload.callback_id}"`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    const action = parts[0];
    const id = parts[1];
    const username = payload.user.name;

    let topic;
    let team;
    try {
        const [topic_, team_] = await Promise.all([
            Topic.get(id),
            Team.get(payload.team.id)
        ]);
        topic = topic_;
        team = team_;
    } catch (err) {
        const errorId = shortid.generate();
        logger.error(`(${errorId}) Could not get team or topic`, payload, err);
        return {
            text: `Internal server error, please try again later\n` +
                `A_GET_FAIL (${errorId})`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (!topic) {
        return {
            text: `Ooops, could not find that topic, it may be expired`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    if (!team) {
        return {
            text: `Your slack team with id "${payload.team.id}" could not be found. Please try to add Poker Planner to your Slack team again.`,
            response_type: 'ephemeral',
            replace_original: false
        };
    }

    switch (action) {
        /**
         * REVEAL
         */
        case 'action':
            const topicAction = payload.actions[0].value;

            /**
             * REVEAL
             */
            if (topicAction == 'reveal') {
                try {
                    logger.info(`[${team.name}(${team.id})] ${username}(${payload.user.id}) revealing votes ` +
                        `for "${topic.title}" w/ id: ${topic.id}`);
                    await Topic.revealTopicMessage(topic, team);

                    process.env.COUNTLY_APP_KEY && Countly.add_event({
                        'key': 'topic_revealed',
                        'count': 1,
                        'segmentation': {}
                    });

                    return '';
                } catch (err) {
                    const errorId = shortid.generate();
                    logger.error(`(${errorId}) Could not reveal topic`, err);
                    return {
                        text: `Could not reveal the topic. Internal server error, please try again later\n` +
                            `A_REVEAL_FAIL (${errorId})`,
                        response_type: 'ephemeral',
                        replace_original: false
                    };
                }
            /**
             * CANCEL
             */
            } else if (topicAction == 'cancel') {
                try {
                    logger.info(`[${team.name}(${team.id})] ${username}(${payload.user.id}) cancelling topic ` +
                        `"${topic.title}" w/ id: ${topic.id}`);
                    await Topic.cancelTopicMessage(topic, team);

                    process.env.COUNTLY_APP_KEY && Countly.add_event({
                        'key': 'topic_cancelled',
                        'count': 1,
                        'segmentation': {}
                    });

                    return '';
                } catch (err) {
                    const errorId = shortid.generate();
                    logger.error(`(${errorId}) Could not cancel topic`, err);
                    return {
                        text: `Could not cancel the topic. Internal server error, please try again later\n` +
                            `A_CANCEL_FAIL (${errorId})`,
                        response_type: 'ephemeral',
                        replace_original: false
                    };
                }
            } else {
                const errorId = shortid.generate();
                logger.error(`(${errorId}) Unknown topic action "${topicAction}"`, payload);
                return {
                    text: `Internal server error, please try again later\n`
                        `A_UNKNOWN_ACTION (${errorId})`,
                    response_type: 'ephemeral',
                    replace_original: false
                };
            }

            break;
        /**
         * VOTE
         */
        case 'vote':
            if (topic.isRevealed) {
                return {
                    text: `You cannot vote on already revealed topic`,
                    response_type: 'ephemeral',
                    replace_original: false
                };
            }

            if (topic.isCancelled) {
                return {
                    text: `You cannot vote on cancelled topic`,
                    response_type: 'ephemeral',
                    replace_original: false
                };
            }

            if (!Topic.isParticipant(topic, payload.user.id)) {
                return {
                    text: `You are not a participant of that topic`,
                    response_type: 'ephemeral',
                    replace_original: false
                };
            }

            try {
                logger.info(`[${team.name}(${team.id})] ${username}(${payload.user.id}) voting ` +
                    `${payload.actions[0].value} points for "${topic.title}" w/ id: ${topic.id}`);
                await Topic.vote(topic, team, payload.user.id, payload.actions[0].value);

                process.env.COUNTLY_APP_KEY && Countly.add_event({
                    'key': 'topic_voted',
                    'count': 1,
                    'segmentation': {
                        'points': payload.actions[0].value
                    }
                });

                return {
                    text: `You voted ${payload.actions[0].value}`,
                    response_type: 'ephemeral',
                    replace_original: false
                };
            } catch (err) {
                const errorId = shortid.generate();
                logger.error(`(${errorId}) Could not vote`, err);
                return {
                    text: `Could not vote. Internal server error, please try again later\n`
                        `A_VOTE_FAIL (${errorId})`,
                    response_type: 'ephemeral',
                    replace_original: false
                };
            }
            break;
        default:
            logger.error(`Unexpected action: "${action}"`);
            return {
                text: `Unexpected action: "${action}"`,
                response_type: 'ephemeral',
                replace_original: false
            };
    }
};
