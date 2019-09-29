require('dotenv').config();
const db = require('sqlite');
const logger = require('./logger');
const Server = require('./server');
const Countly = require('countly-sdk-nodejs');



/**
 * Boot flow
 */
async function main() {
    logger.info('Opening db...');
    await db.open(process.env.DB_FILE, { Promise });

    logger.info(`Migrating db (force: ${!!process.env.DB_FORCE_MIGRATIONS})...`);
    await db.migrate({ force: process.env.DB_FORCE_MIGRATIONS ? 'last' : false });

    logger.info('Starting the server...');
    const server = await Server.create();
    await Server.start(server);

    Countly.init({
        app_key: 'a5de58ab142e4459108167c410777d8edf9be80d',
        url: 'https://countly.deniz.co'
    });

    logger.info('Boot successful!');
}


main().catch((err) => {
    logger.error('Could not boot', err);
    process.exit(1);
});
