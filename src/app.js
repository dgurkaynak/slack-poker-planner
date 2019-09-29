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

    if (process.env.COUNTLY_APP_KEY && process.env.COUNTLY_URL) {
        logger.info(`Initing countly - ${process.env.COUNTLY_URL} with app key: ${process.env.COUNTLY_APP_KEY}`);
        Countly.init({
            app_key: process.env.COUNTLY_APP_KEY,
            url: process.env.COUNTLY_URL
        });
    }

    logger.info('Boot successful!');
}


main().catch((err) => {
    logger.error('Could not boot', err);
    process.exit(1);
});
