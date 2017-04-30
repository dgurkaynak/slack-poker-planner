const winston = require('winston');
const Hapi = require('hapi');
const path = require('path');
const request = require('request-promise');
require('dotenv').config();


const server = new Hapi.Server();
server.connection({ port: process.env.PORT });

server.route({
    method: 'POST',
    path: path.join(process.env.BASE_PATH, 'slack/pp-command'),
    handler: (request, reply) => {
        winston.info('pp-command', request.payload);

        request({
            url: request.payload.response_url,
            method: 'POST',
            body: {
                text: 'Some response kanki',
                response_type: 'ephemeral',
                attachments: [
                    {
                        "text": "Choose a game to play",
                        "fallback": "You are unable to choose a game",
                        "callback_id": "wopr_game",
                        "color": "#3AA3E3",
                        "attachment_type": "default",
                        "actions": [
                            {
                                "name": "game",
                                "text": "Chess",
                                "type": "button",
                                "value": "chess"
                            },
                            {
                                "name": "game",
                                "text": "Falken's Maze",
                                "type": "button",
                                "value": "maze"
                            },
                            {
                                "name": "game",
                                "text": "Thermonuclear War",
                                "style": "danger",
                                "type": "button",
                                "value": "war",
                                "confirm": {
                                    "title": "Are you sure?",
                                    "text": "Wouldn't you prefer a good game of chess?",
                                    "ok_text": "Yes",
                                    "dismiss_text": "No"
                                }
                            }
                        ]
                    }
                ]
            }
        })
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

