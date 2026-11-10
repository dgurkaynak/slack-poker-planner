import 'dotenv/config';

import { logger } from './lib/logger.ts';
import * as sqlite from './lib/sqlite.ts';
import * as redis from './lib/redis.ts';
import express from 'express';
import bodyParser from 'body-parser';
import * as exphbs from 'express-handlebars';
import { OAuthRoute } from './routes/oauth.ts';
import { PPCommandRoute } from './routes/pp-command.ts';
import { InteractivityRoute } from './routes/interactivity.ts';
import * as SessionStore from './session/session-model.ts';
import { getOlay } from './lib/olay.ts';

const PORT = process.env.PORT || 3000;
const BASE_PATH = process.env.BASE_PATH || '/';
const SLACK_SCOPE = 'commands,chat:write';
const USE_REDIS = process.env.USE_REDIS?.toLowerCase() === 'true' || false;

async function main() {
  logger.init();

  await sqlite.init();

  if (USE_REDIS) {
    await redis.init();
    await SessionStore.restore();
  }

  await initServer();

  // If olay env variables exists, init olay client
  if (process.env.OLAY_WS_URL && process.env.OLAY_WS_PROJECT) {
    logger.info({
      msg: `Initing olay`,
      url: process.env.OLAY_WS_URL,
      project: process.env.OLAY_WS_PROJECT,
    });
    const _olay = getOlay();
  }

  logger.info({ msg: 'Boot successful!' });
}

async function initServer(): Promise<void> {
  const server = express();

  // Setup handlebars
  server.engine('html', exphbs.engine({ extname: '.html' }));
  server.set('view engine', 'html');
  server.set('views', 'src/views'); // relative to process.cwd

  // Parse body
  server.use(bodyParser.urlencoded({ extended: false }));
  server.use(bodyParser.json());

  // Serve static files
  server.use(BASE_PATH, express.static('src/public')); // relative to process.cwd

  // Setup routes
  initRoutes(server);

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      logger.info({ msg: `Server running`, port: PORT });
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
        SLACK_SCOPE,
        SLACK_APP_ID: process.env.SLACK_APP_ID,
      },
    });
  });

  router.get('/privacy', (req, res, next) => {
    res.render('privacy', {
      layout: false,
      data: {
        SLACK_APP_ID: process.env.SLACK_APP_ID,
      },
    });
  });

  router.get('/oauth', OAuthRoute.handle);
  router.post('/slack/pp-command', PPCommandRoute.handle);
  router.post('/slack/pp-slash-command', PPCommandRoute.handle);
  router.post('/slack/action-endpoint', InteractivityRoute.handle);
  router.post('/slack/interactivity', InteractivityRoute.handle);

  router.get('/slack/direct-install', (req, res, next) => {
    const url = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${SLACK_SCOPE}`;
    res.status(302).redirect(url);
  });

  // Serve under specified base path
  server.use(BASE_PATH, router);
}

main().catch((err) => {
  logger.error({ msg: 'Could not boot', err });
  process.exit(1);
});
