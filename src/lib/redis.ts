import * as redis from 'redis';

import logger from './logger';

let client: redis.RedisClient;

export async function init() {
  if (client) {
    logger.warn({ msg: `Trying to init redis multiple times!` });
    return client;
  }

  logger.info({ msg: `Creating redis client...` });
  client = redis.createClient();

  await new Promise((resolve, reject) => {
    client.once('ready', resolve);
    client.once('error', reject);
  });

  client.on('error', (err) => {
    logger.error({
      msg: `Unexpected redis error`,
      err,
    });
  });

  return client;
}

export function getSingleton() {
  return client;
}
