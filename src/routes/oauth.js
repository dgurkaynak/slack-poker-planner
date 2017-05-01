const winston = require('winston');
const WebClient = require('@slack/client').WebClient;
const Team = require('../team');


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
            .then(() => {
                // Display success
                reply('Success');
            })
            .catch(err => winston.error('Could not oauth', err));
    } else if (request.query.error) {
        // Error
        // Display error
    } else {
        // Unknown error
    }

    reply();
};
