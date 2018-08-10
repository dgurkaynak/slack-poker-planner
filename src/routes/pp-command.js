const winston = require('winston');
const Team = require('../team');
const Topic = require('../topic');
const Boom = require('boom');


module.exports = async (request, reply) => {
    // winston.info('pp-command', request.payload);

    const ppCommand = request.payload;
    const topic = Topic.createFromPPCommand(ppCommand);

    if (ppCommand.token != process.env.SLACK_VERIFICATION_TOKEN) {
        winston.error(`Could not created topic, slack verification token is invalid`, ppCommand);
        return reply(Boom.badRequest(`Invalid slack verification token, please get in touch with the maintainer`));
    }

    const team = await Team.get(ppCommand.team_id);
    if (!team) {
        winston.error(`Could not created topic, team could not be found`, ppCommand);
        return reply(Boom.badRequest(`Your slack team "${ppCommand.team_domain}" could not be found, please add Poker Planner app to your slack team again`));
    }

    reply();

    try {
        await Topic.init(topic, team);
    } catch (err) {
        await Topic.rejectPPCommand(ppCommand, err.message);
    }
};
