require('dotenv').config();
const db = require('sqlite');
const winston = require('winston');
const Server = require('./server');



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
async function main() {
    winston.info('Opening db...');
    await db.open(process.env.DB_FILE, { Promise });

    winston.info(`Migrating db (force: ${!!process.env.DB_FORCE_MIGRATIONS})...`);
    await db.migrate({ force: process.env.DB_FORCE_MIGRATIONS ? 'last' : false });

    winston.info('Starting the server...');
    const server = Server.create();
    await Server.start(server);

    winston.info('Boot successful!');
}


main().catch((err) => {
    console.error('Could not boot', err);
    process.exit(1);
});
