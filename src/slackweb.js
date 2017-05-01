const SlackWebClient = require('@slack/client').WebClient;
module.exports = new SlackWebClient(process.env.SLACK_API_TOKEN);
