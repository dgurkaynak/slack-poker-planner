require('dotenv').config();
const db = require('sqlite');
const winston = require('winston');
const Server = require('./server');


const server = Server.create();


/**
 * Set-up logging
 */
const SPLAT = Symbol.for('splat');
winston.add(new winston.transports.Console({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(log => {
            const splat = log[SPLAT];
            return `${log.timestamp} ${log.level}: ${log.message} ${splat ? JSON.stringify(splat) : ''}`;
        })
    )
}));


/**
 * Boot flow
 */
winston.info('Opening db...');
db
    .open(process.env.DB_FILE, { Promise })
    .then(() => winston.info(`Migrating db (force: ${!!process.env.DB_FORCE_MIGRATIONS})...`))
    .then(() => db.migrate({ force: process.env.DB_FORCE_MIGRATIONS ? 'last' : false }))
    .then(() => winston.info('Starting the server...'))
    .then(() => Server.start(server))
    .then(() => winston.info('Boot successful!'))
    .catch(err => winston.error(`Could not boot - ${err}`));
