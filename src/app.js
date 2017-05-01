require('dotenv').config();
const db = require('sqlite');
const winston = require('winston');
const Server = require('./server');


const server = Server.create();

/**
 * Boot flow
 */
winston.info('Opening db...');
db
    .open(process.env.DB_FILE, { Promise })
    .then(() => winston.info(`Migrating db (force -> ${!!process.env.DB_FORCE_MIGRATIONS})...`))
    .then(() => db.migrate({ force: process.env.DB_FORCE_MIGRATIONS ? 'last' : false }))
    .then(() => winston.info('Starting the server...'))
    .then(() => Server.start(server))
    .then(() => winston.info('Boot successful!'))
    .catch(err => winston.error('Could not boot', err));
