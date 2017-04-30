const winston = require('winston');
const Hapi = require('hapi');
const path = require('path');
require('dotenv').config();


const server = new Hapi.Server();
server.connection({ port: process.env.PORT });

server.route({
    method: 'POST',
    path: path.join(process.env.BASE_PATH, 'slack/pp-command'),
    handler: (request, reply) => {
        winston.info('pp-command', request.payload);
        reply();
    }
});

server.route({
    method: 'POST',
    path: path.join(process.env.BASE_PATH, 'slack/action-endpoint'),
    handler: (request, reply) => {
        winston.info('action-endpoint', request.payload);
        reply();
    }
});

server.route({
    method: 'POST',
    path: path.join(process.env.BASE_PATH, 'slack/options-load-endpoint'),
    handler: (request, reply) => {
        winston.info('options-load-endpoint', request.payload);
        reply();
    }
});

server.start((err) => {
    if (err) {
        winston.error('Could not start server', err);
        return;
    }

    winston.info(`Server running at: ${server.info.uri}`);
});

