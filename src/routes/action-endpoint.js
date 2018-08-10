const winston = require('winston');
const Team = require('../team');
const Topic = require('../topic');
const Boom = require('boom');


module.exports = async (request, reply) => {
    // winston.info('action-endpoint', request.payload);

    const payload = JSON.parse(request.payload.payload);
    const parts = payload.callback_id.split('_');

    if (payload.token != process.env.SLACK_VERIFICATION_TOKEN) {
        winston.error(`Could not process action, invalid verification token`, payload);
        return reply(Boom.badRequest('Invalid slack verification token, please get in touch with the maintainer'));
    }

    if (parts.length != 2) {
        winston.error(`Could not process action, could not parse callback_id`, payload);
        return reply(Boom.badRequest(`Could not parse callback_id "${payload.callback_id}"`));
    }

    const action = parts[0];
    const id = parts[1];
    const username = payload.user.name;

    const [topic, team] = await Promise.all([
        Topic.get(id),
        Team.get(payload.team.id)
    ]);

    if (!topic) {
        return reply({
            text: `Ooops, could not find that topic`,
            response_type: 'ephemeral',
            replace_original: false
        });
    }

    if (!team) {
        return reply({
            text: `Your slack team with id "${payload.team.id}" could not be found. Please try to add Poker Planner app to your slack team again.`,
            response_type: 'ephemeral',
            replace_original: false
        });
    }

    switch (action) {
        /**
         * REVEAL
         */
        case 'action':
            try {
                await Topic.revealTopicMessage(topic, team);
                return reply();
            } catch (err) {
                winston.error(`Could not reveal topic, ${err}`);
                return reply({
                    text: `Could not reveal the topic. Internal server error, please try again later.`,
                    response_type: 'ephemeral',
                    replace_original: false
                });
            }
            break;
        /**
         * VOTE
         */
        case 'vote':
            if (topic.isRevealed) {
                return reply({
                    text: `You cannot vote already revealed topic`,
                    response_type: 'ephemeral',
                    replace_original: false
                });
            }

            if (!Topic.getParticipant(topic, payload.user.name)) {
                return reply({
                    text: `You are not a participant of that topic`,
                    response_type: 'ephemeral',
                    replace_original: false
                });
            }

            try {
                await Topic.vote(topic, team, payload.user.name, payload.actions[0].value);
                return reply({
                    text: `You voted ${payload.actions[0].value}`,
                    response_type: 'ephemeral',
                    replace_original: false
                });
            } catch (err) {
                winston.error(`Could not vote, ${err}`);
                return reply({
                    text: `Could not vote. Internal server error, please try again later.`,
                    response_type: 'ephemeral',
                    replace_original: false
                });
            }
            break;
        default:
            winston.error(`Unexpected action: "${action}"`);
            return reply({
                text: `Unexpected action: "${action}"`,
                response_type: 'ephemeral',
                replace_original: false
            });
    }
};
