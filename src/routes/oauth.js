const winston = require('winston');
const WebClient = require('@slack/client').WebClient;
const Team = require('../team');
const Boom = require('boom');


module.exports = (request, reply) => {
    if (request.query.code) {
        // Installed!
        const slackWebClient = new WebClient();
        return slackWebClient.oauth
            .access(process.env.SLACK_CLIENT_ID, process.env.SLACK_CLIENT_SECRET, request.query.code)
            .then(response => Team.createOrUpdate({
                id: response.team_id,
                name: response.team_name,
                access_token: response.access_token,
                scope: response.scope,
                user_id: response.user_id
            }))
            .then((team) => {
                // Display success
                winston.info(`Added to team "${team.name}" (${team.id}) by user ${team.user_id}`);
                reply('Success');
            })
            .catch((err) => {
                winston.error(`Could not oauth, slack-side error - ${err}`);
                reply(err);
            });
    } else if (request.query.error) {
        // Error
        // Display error
        winston.error(`Could not oauth, error from query - ${request.query.error}`);
        reply(request.query.error);
    } else {
        // Unknown error
        winston.error(`Could not oauth, unknown error`);
        reply('Unknown error');
    }
};
