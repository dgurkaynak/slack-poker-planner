import { accessInfo } from './lib/gus';

require('dotenv').config();
import {
  BasicTracerProvider,
  BatchSpanProcessor,
} from '@opentelemetry/tracing';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
setupTracing();

import logger from './lib/logger';
import * as gus from './lib/gus';
import * as sqlite from './lib/sqlite';
import * as redis from './lib/redis';
import Countly from 'countly-sdk-nodejs';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as exphbs from 'express-handlebars';
import { OAuthRoute } from './routes/oauth';
import { PPCommandRoute } from './routes/pp-command';
import { InteractivityRoute } from './routes/interactivity';
import prettyMilliseconds from 'pretty-ms';
import * as SessionStore from './session/session-model';

async function main() {

  await sqlite.init();
  if (process.env.USE_REDIS) {
    await redis.init();
    await SessionStore.restore();
  }
  await initServer();

  // gus.init();
  // gus.getConnection()
  //   .query("SELECT Id, Name, Subject__c FROM ADM_Work__c LIMIT 1", function(err: any, result: any) {
  //     if (err) { return logger.error(err); }
  //     logger.info("total : " + result.totalSize);
  //     logger.info("fetched : " + result.records.length);
  //     logger.info("done ? : " + result.done);
  //     if (!result.done) {
  //       // you can use the locator to fetch next records set.
  //       // Connection#queryMore()
  //       logger.info("next records URL : " + result.nextRecordsUrl);
  //     }
  //     logger.info(result.records[0])
  //   });

  // If countly env variables exists, start countly stat reporting
  if (process.env.COUNTLY_APP_KEY && process.env.COUNTLY_URL) {
    logger.info({
      msg: `Initing countly`,
      url: process.env.COUNTLY_URL,
      appKey: process.env.COUNTLY_APP_KEY,
    });
    Countly.init({
      app_key: process.env.COUNTLY_APP_KEY,
      url: process.env.COUNTLY_URL,
    });
  }

  logger.info({ msg: 'Boot successful!' });
}

// async function initGus(): Promise<void> {
//   const jsforce = require('jsforce');
//   const gus = new jsforce.Connection(
//     {
//       version: '50.0'
//     }
//   );
//   logger.info({ msg: `in initGus ${process.env.GUS_USER}` });
//   // Login to GUS, then start the processor
//   gus.login(process.env.GUS_USER, process.env.GUS_PASSWORD)
//     .then(() => {
//       logger.info('CONNECTED, W00t');
//       //gus.query("SELECT Id, Name, Subject__c FROM ADM_Work__c LIMIT 1");
//       gus.query("SELECT Id, Name, Subject__c FROM ADM_Work__c LIMIT 1", function(err: any, result: any) {
//         if (err) { return logger.error(err); }
//         logger.info("total : " + result.totalSize);
//         logger.info("fetched : " + result.records.length);
//         logger.info("done ? : " + result.done);
//         if (!result.done) {
//           // you can use the locator to fetch next records set.
//           // Connection#queryMore()
//           logger.info("next records URL : " + result.nextRecordsUrl);
//         }
//       logger.info(result.records[0])
//       });
//     })
//     // .then((err: any, result: any) => {
//     //   if (err) { return logger.error(err); }
//     //   logger.info(`Query result is is ${result}`);
//     //   logger.info("total : " + result.totalSize);
//     //   logger.info("fetched : " + result.records.length);
//     //   logger.info("done ? : " + result.done);
//     //   if (!result.done) {
//     //     // you can use the locator to fetch next records set.
//     //     // Connection#queryMore()
//     //     logger.info("next records URL : " + result.nextRecordsUrl);
//     //   }
//     //   logger.info(result.records[0])
//     // })
//     .catch((err: any) => {
//       if (err.stack === undefined) logger.error('ERROR: ' + err)
//       logger.error(err.stack)
//     });
// }

async function initServer(): Promise<void> {
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
      logger.info({ msg: `Server running`, port: process.env.PORT });
      resolve();
    });
  });
}

function initRoutes(server: express.Express) {
  const router = express.Router();
  const humanReadableSessionTTL = prettyMilliseconds(
    Number(process.env.SESSION_TTL),
    { verbose: true }
  );

  router.get('/', (req, res, next) => {
    res.render('index', {
      layout: false,
      data: {
        SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
        SLACK_SCOPE: process.env.SLACK_SCOPE,
        SLACK_APP_ID: process.env.SLACK_APP_ID,
        COUNTLY_URL: process.env.COUNTLY_URL,
        COUNTLY_APP_KEY: process.env.COUNTLY_APP_KEY,
        HUMAN_READABLE_SESSION_TTL: humanReadableSessionTTL,
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
  router.post('/slack/pp-slash-command', PPCommandRoute.handle);
  router.post('/slack/action-endpoint', InteractivityRoute.handle);
  router.post('/slack/interactivity', InteractivityRoute.handle);

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
      debug: () => {},
      info: () => {},
      warn: logger.warn.bind(logger),
      error: logger.error.bind(logger),
    },
  });
  traceProvider.addSpanProcessor(new BatchSpanProcessor(exporter));

  logger.info({
    msg: `Trace reporter started`,
    jaegerAgent: {
      host: process.env.JAEGER_HOST,
      port: process.env.JAEGER_PORT,
    },
  });
}

main().catch((err) => {
  logger.error({ msg: 'Could not boot', err });
  process.exit(1);
});
