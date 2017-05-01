module.exports = (request, reply) => {
    reply.view('index', {
        SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
        SLACK_SCOPE: process.env.SLACK_SCOPE
    });
};
