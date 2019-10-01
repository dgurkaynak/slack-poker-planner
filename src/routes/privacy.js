module.exports = (request, reply) => {
    return reply.view('privacy', {
        COUNTLY_URL: process.env.COUNTLY_URL,
        COUNTLY_APP_KEY: process.env.COUNTLY_APP_KEY
    });
};
