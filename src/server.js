const winston = require('winston');
const Hapi = require('hapi');
const path = require('path');
const Vision = require('vision');
const Handlebars = require('handlebars');
const inert = require('inert');


function create() {
    const server = new Hapi.Server();
    server.connection({ port: process.env.PORT });
    server.register(Vision, (err) => {
        if (err) {
            winston.error(`Cannot register vision - ${err}`);
        }

        server.views({
            engines: {
                html: Handlebars
            },
            path: __dirname + '/views'
        });
    });
    server.register(inert, (err) => {
        if (err) {
            winston.error(`Cannot register inert - ${err}`);
        }
    });

    return server;
}


function start(server) {
    return new Promise((resolve, reject) => {
        initRoutes(server);

        server.start((err) => {
            if (err) {
                winston.error(`Could not start server - ${err}`);
                return reject(err);
            }

            winston.info(`Server running at: ${server.info.uri}`);
            resolve();
        });
    });
}


function initRoutes(server) {
    server.route({
        method: 'GET',
        path: process.env.BASE_PATH,
        handler: require('./routes/index')
    });

    server.route({
        method: 'GET',
        path: path.join(process.env.BASE_PATH, 'demo.gif'),
        handler: function (request, reply) {
            reply.file('./demo.gif');
        }
    });

    server.route({
        method: 'GET',
        path: path.join(process.env.BASE_PATH, 'oauth'),
        handler: require('./routes/oauth')
    });

    server.route({
        method: 'POST',
        path: path.join(process.env.BASE_PATH, 'slack/pp-command'),
        handler: require('./routes/pp-command')
    });

    server.route({
        method: 'POST',
        path: path.join(process.env.BASE_PATH, 'slack/action-endpoint'),
        handler: require('./routes/action-endpoint')
    });

    // server.route({
    //     method: 'POST',
    //     path: path.join(process.env.BASE_PATH, 'slack/options-load-endpoint'),
    //     handler: (request, reply) => {
    //         winston.info('options-load-endpoint', request.payload);
    //         reply();
    //     }
    // });
}


module.exports = { create, start };
