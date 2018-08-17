module.exports = (request, reply) => {
    return reply.view('index', {
        SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
        SLACK_SCOPE: process.env.SLACK_SCOPE
    });
};
