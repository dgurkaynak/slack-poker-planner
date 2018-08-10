const winston = require('winston');
const Team = require('../team');
const Topic = require('../topic');
const Boom = require('boom');


module.exports = (request, reply) => {
    // winston.info('action-endpoint', request.payload);

    const payload = JSON.parse(request.payload.payload);
    const parts = payload.callback_id.split('_');

    if (payload.token != process.env.SLACK_VERIFICATION_TOKEN)
        return reply(Boom.badRequest('Verification token is invalid'));

    if (parts.length != 2)
        return reply(Boom.badRequest(`Could not parse callback_id "${payload.callback_id}".`));

    const action = parts[0];
    const id = parts[1];
    const username = payload.user.name;

    return Promise
        .all([
            Topic.get(id),
            Team.get(payload.team.id)
        ])
        .then(([topic, team]) => {
            if (!topic)
                return reply(Boom.badRequest(`Could not find topic with id "${id}".`));

            if (!team)
                return reply(Boom.badRequest(`Team id "${payload.team.id}" not found.`));

            switch (action) {
                case 'action':
                    return Topic
                        .reveal(topic, team)
                        .then(() => reply())
                        .catch((err) => {
                            winston.error(`Could not reveal topic, ${err}`);
                            reply(Boom.badImplementation('Internal server error, please try again later.', err));
                        });
                case 'vote':
                    return Topic
                        .vote(topic, team, payload.user.name, payload.actions[0].value)
                        .then(() => reply())
                        .catch((err) => {
                            winston.error(`Could not vote, ${err}`);
                            reply(Boom.badImplementation('Internal server error, please try again later.', err));
                        });
                default:
                    return reply(Boom.badRequest(`Unknown action: "${action}"`));
            }
        });
};
