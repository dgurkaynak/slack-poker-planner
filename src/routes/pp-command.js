const winston = require('winston');
const Team = require('../team');
const Topic = require('../topic');
const Boom = require('boom');


module.exports = (request, reply) => {
    // winston.info('pp-command', request.payload);

    const ppCommand = request.payload;
    const topic = Topic.createFromPPCommand(ppCommand);

    if (ppCommand.token != process.env.SLACK_VERIFICATION_TOKEN)
        return reply(Boom.badRequest('Verification token is invalid'));

    reply();

    Team
        .get(ppCommand.team_id)
        .then((team) => {
            if (!team)
                throw new Error(`Team id "${ppCommand.team_id}" not found.`);

            return Topic.init(topic, team);
        })
        .catch((err) => {
            winston.error('Could not create topic', err);
            return Topic.rejectPPCommand(ppCommand, err.message);
        });
};
