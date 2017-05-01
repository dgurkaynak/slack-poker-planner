require('dotenv').config();
const winston = require('winston');
const Hapi = require('hapi');
const path = require('path');
const Topic = require('./topic');
const rp = require('request-promise');
const Vision = require('vision');
const Handlebars = require('handlebars');
const WebClient = require('@slack/client').WebClient;


const topics = {};
const server = new Hapi.Server();
server.connection({ port: process.env.PORT });
server.register(Vision, (err) => {
    if (err) {
        winston.error('Cannot register vision');
    }

    server.views({
        engines: {
            html: Handlebars
        },
        path: __dirname + '/views',
        // layout: 'layout'
    });
})


server.route({
    method: 'GET',
    path: process.env.BASE_PATH,
    handler: (request, reply) => {
        reply.view('index', {
            SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
            SLACK_SCOPE: process.env.SLACK_SCOPE
        });
    }
});


server.route({
    method: 'GET',
    path: path.join(process.env.BASE_PATH, 'oauth'),
    handler: (request, reply) => {
        if (request.query.code) {
            // Installed!
            const webClient = new WebClient();
            webClient.oauth
                .access(process.env.SLACK_CLIENT_ID, process.env.SLACK_CLIENT_SECRET, request.query.code)
                .then((response) => {
                    console.log('response', response);
                })
                .catch((err) => {
                    console.log('err', err);
                });
        } else if (request.query.error) {
            // Error
        } else {
            // Unknown error
        }

        reply();
    }
});


server.route({
    method: 'POST',
    path: path.join(process.env.BASE_PATH, 'slack/pp-command'),
    handler: (request, reply) => {
        winston.info('pp-command', request.payload);
        reply();

        const topic = new Topic(request.payload);
        topic
            .init()
            .then(() => {
                topics[topic.id] = topic;

                topic.once('revealed', () => {
                    topics[topic.id].removeAllListeners();
                    delete topics[topic.id];
                });
            })
            .catch((err) => {
                winston.error('Could not init topic', err);
            });
    }
});


server.route({
    method: 'POST',
    path: path.join(process.env.BASE_PATH, 'slack/action-endpoint'),
    handler: (request, reply) => {
        winston.info('action-endpoint', request.payload);
        reply();

        const payload = JSON.parse(request.payload.payload);
        const parts = payload.callback_id.split('_');
        if (parts.length != 2) {
            winston.warn('Could not parse callback id', payload.callback_id);
            return;
        }

        const action = parts[0];
        const id = parts[1];
        const topic = topics[id];
        const username = payload.user.name;

        if (!topic) {
            winston.warn('Could not find topic', {id, action, callbackId: payload.callback_id});
            return;
        }

        switch (action) {
            case 'action':
                topic.reveal();
                break;
            case 'vote':
                topic
                    .vote(payload.user.name, payload.actions[0].value)
                    .catch(() => {});
                break;
            default:
                winston.warn('Unknown action', {id, action, callbackId: payload.callback_id});
                break;
        }
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

