const winston = require('winston');
const Team = require('../team');
const Topic = require('../topic');
const Boom = require('boom');


module.exports = async (request, reply) => {
    const ppCommand = request.payload;
    const topic = Topic.createFromPPCommand(ppCommand);

    if (ppCommand.token != process.env.SLACK_VERIFICATION_TOKEN) {
        winston.error(`Could not created topic, slack verification token is invalid`, ppCommand);
        return reply(Boom.badRequest(`Invalid slack verification token, please get in touch with the maintainer`));
    }

    if (!topic.title) {
        return reply(Boom.badRequest(`Topic cannot be empty`));
    }

    if (topic.ppCommand.channel_name == 'directmessage') {
        return reply(Boom.badRequest(`Poker planning cannot be started in direct messages`));
    }

    let team;
    try {
        team = await Team.get(ppCommand.team_id);
    } catch (err) {
        winston.error(`Could not created topic, could not get the team from db, ${err}`, ppCommand);
        return reply(Boom.badImplementation(`Internal server error, please try again later`));
    }

    if (!team) {
        winston.error(`Could not created topic, team could not be found`, ppCommand);
        return reply(Boom.badRequest(`Your slack team "${ppCommand.team_domain}" could not be found, please add Poker Planner app to your slack team again`));
    }

    reply();

    try {
        winston.info(`[${team.name}(${team.id})] ${ppCommand.user_name}(${ppCommand.user_id}) creating ` +
            `a topic with title "${topic.title}" on #${ppCommand.channel_name}(${ppCommand.channel_id}) ` +
            `w/ ${topic.mentions.length} mention(s), id: ${topic.id}`);
        await Topic.init(topic, team);
    } catch (err) {
        winston.error(`Could not created topic, ${err}`, ppCommand);
        await Topic.rejectPPCommand(ppCommand, `Internal server error, please try again later`);
    }
};
