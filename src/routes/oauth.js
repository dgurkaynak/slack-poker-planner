const logger = require('../logger');
const WebClient = require('@slack/web-api').WebClient;
const Team = require('../team');
const Countly = require('countly-sdk-nodejs');


module.exports = async (request, reply) => {
    if (request.query.code) {
        // Installed!
        try {
            const slackWebClient = new WebClient();
            const accessResponse = await slackWebClient.oauth.v2.access({
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code: request.query.code
            });

            const team = await Team.createOrUpdate({
                id: accessResponse.team.id,
                name: accessResponse.team.name,
                access_token: accessResponse.access_token,
                scope: accessResponse.scope,
                user_id: accessResponse.authed_user.id
            });

            process.env.COUNTLY_APP_KEY && Countly.add_event({
                'key': 'added_to_team',
                'count': 1,
                'segmentation': {}
            });

            logger.info(`Added to team "${team.name}" (${team.id}) by user ${team.user_id}`);
            return reply.view('oauth-success', {
                SLACK_APP_ID: process.env.SLACK_APP_ID,
                TEAM_NAME: team.name
            });
        } catch (err) {
            logger.error(`Could not oauth, slack-side error - ${err}`);
            return 'Internal server error, please try again later';
        }
    } else if (request.query.error) {
        // Error
        // Display error
        logger.error(`Could not oauth, error from query - ${request.query.error}`);
        return request.query.error;
    } else {
        // Unknown error
        logger.error(`Could not oauth, unknown error`);
        return 'Unknown error';
    }
};
