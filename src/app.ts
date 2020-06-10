require('dotenv').config();
import {
  BasicTracerProvider,
  BatchSpanProcessor,
} from '@opentelemetry/tracing';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
setupTracing();

import * as logger from './lib/logger';
import * as sqlite from './lib/sqlite';
import * as redis from './lib/redis';
import Countly from 'countly-sdk-nodejs';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as exphbs from 'express-handlebars';
import { OAuthRoute } from './routes/oauth';
import { PPCommandRoute } from './routes/pp-command';
import { ActionRoute } from './routes/action';

async function main() {
  // Start sqlite
  await sqlite.init();

  // Start redis
  if (process.env.USE_REDIS) {
    await redis.init();
  }

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

  // Parse body
  server.use(bodyParser.urlencoded({ extended: false }));
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
        COUNTLY_APP_KEY: process.env.COUNTLY_APP_KEY,
      },
    });
  });

  router.get('/oauth', OAuthRoute.handle);
  router.post('/slack/pp-command', PPCommandRoute.handle);
  router.post('/slack/action-endpoint', ActionRoute.handle);

  router.get('/slack/direct-install', (req, res, next) => {
    const url = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${process.env.SLACK_SCOPE}`;
    res.status(302).redirect(url);
  });

  // Serve under specified base path
  server.use(`${process.env.BASE_PATH}`, router);
}

async function setupTracing() {
  const traceProvider = new BasicTracerProvider();
  traceProvider.register();

  if (!process.env.REPORT_TRACES) {
    return;
  }

  const exporter = new JaegerExporter({
    serviceName: 'pp',
    tags: [],
    host: process.env.JAEGER_HOST,
    port: parseInt(process.env.JAEGER_PORT, 10),
    logger: {
      debug: (...args: any[]) =>
        console.debug('[jaeger-exporter][debug]', ...args),
      info: (...args: any[]) =>
        console.info('[jaeger-exporter][info]', ...args),
      warn: (...args: any[]) =>
        console.warn('[jaeger-exporter][warn]', ...args),
      error: (...args: any[]) =>
        console.error('[jaeger-exporter][error]', ...args),
    },
  });
  traceProvider.addSpanProcessor(new BatchSpanProcessor(exporter));

  logger.info(
    `Traces will be reported to jaeger-agent on ${process.env.JAEGER_HOST}:${process.env.JAEGER_PORT}`
  );
}

main().catch((err) => {
  logger.error('Could not boot', err);
  process.exit(1);
});
