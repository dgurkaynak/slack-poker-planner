require('dotenv').config();
import * as logger from './lib/logger';
import * as sqlite from './lib/sqlite';
import Countly from 'countly-sdk-nodejs';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as exphbs from 'express-handlebars';

async function main() {
  // Start sqlite
  await sqlite.init();

  // Start server
  await initServer();

  // If countly env variables exists, start countly stat reporting
  if (process.env.COUNTLY_APP_KEY && process.env.COUNTLY_URL) {
    logger.info(
      `Initing countly - ${process.env.COUNTLY_URL} with app key: ${process.env.COUNTLY_APP_KEY}`
    );
    Countly.init({
      app_key: process.env.COUNTLY_APP_KEY,
      url: process.env.COUNTLY_URL,
    });
  }

  logger.info('Boot successful!');
}

async function initServer() {
  const server = express();

  // Setup handlebars
  server.engine('html', exphbs({ extname: '.html' }));
  server.set('view engine', 'html');
  server.set('views', 'src/views'); // relative to process.cwd
  server.set('view cache', true);

  // Parse json body
  server.use(bodyParser.json());

  // Serve static files
  server.use(process.env.BASE_PATH, express.static('src/public')); // relative to process.cwd

  // Setup routes
  initRoutes(server);

  return new Promise((resolve, reject) => {
    server.listen(process.env.PORT, (err) => {
      if (err) return reject(err);
      logger.info(`Server running on ${process.env.PORT}`);
      resolve();
    });
  });
}

function initRoutes(server: express.Express) {
  const router = express.Router();

  router.get('/', (req, res, next) => {
    res.render('index', {
      layout: false,
      data: {
        SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
        SLACK_SCOPE: process.env.SLACK_SCOPE,
        SLACK_APP_ID: process.env.SLACK_APP_ID,
        COUNTLY_URL: process.env.COUNTLY_URL,
        COUNTLY_APP_KEY: process.env.COUNTLY_APP_KEY,
      },
    });
  });

  router.get('/privacy', (req, res, next) => {
    res.render('privacy', {
      layout: false,
      data: {
        SLACK_APP_ID: process.env.SLACK_APP_ID,
        COUNTLY_URL: process.env.COUNTLY_URL,
        COUNTLY_APP_KEY: process.env.COUNTLY_APP_KEY
      },
    });
  });

  // Serve under specified base path
  server.use(`${process.env.BASE_PATH}`, router);
}

main().catch((err) => {
  logger.error('Could not boot', err);
  process.exit(1);
});
