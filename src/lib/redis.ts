import * as redis from 'redis';
import logger from './logger';

let client: redis.RedisClientType;

export async function init() {
  logger.info({ msg: `Creating redis client...` });
  client = redis.createClient({
    url: process.env.REDIS_URL,
  });

  await client.connect();

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
