import * as redis from '../lib/redis';
import { promisify } from 'util';
import { Trace, getSpan } from '../lib/trace-decorator';
import logger from '../lib/logger';

export interface IUser {
  /**
   * Slack User ID.
   */
  id: string;
  /**
   * Lifetime Points
   */
  points: Record<string, number>;
  /**
   * Votes like { _sessionId_: '_point_', U2147483698: '2' }
   */
  votes: { [key: string]: string };
}

// If `process.env.USE_REDIS` is falsy, in-memory db will be used
const users: { [key: string]: IUser } = {};

export class UserStore {
  @Trace({ name: 'user.findById' })
  static async findById(id: string): Promise<IUser> {
    if (!process.env.USE_REDIS) {
      return users[id];
    }

    const span = getSpan();
    span?.setAttribute('id', id);
    const client = redis.getSingleton();
    const getAsync = promisify(client.get.bind(client));
    const rawUser = await getAsync(buildUserRedisKey(id));

    if (!rawUser) return;
    return JSON.parse(rawUser);
  }

  @Trace({ name: 'user.findByIds' })
  static async findByIds(ids: string[]): Promise<IUser[]> {
    if (!ids) {
      return;
    }

    if (!process.env.USE_REDIS) {
      ids.reduce((acc: IUser[], id: string) => {
        acc.push(users[id]);
        return acc;
      }, [] as IUser[]);
    }

    const span = getSpan();
    span?.setAttribute('ids', ids);
    const client = redis.getSingleton();
    const keys = ids.map((id) => buildUserRedisKey(id));
    const getAsync = promisify(client.mget.bind(client));
    const rawUsers = await getAsync(keys);

    if (!rawUsers) return;
    return rawUsers.map((user: string) => JSON.parse(user));
  }

  @Trace({ name: 'user.upsert' })
  static async upsert(user: IUser) {
    if (!process.env.USE_REDIS) {
      users[user.id] = user;
      return;
    }

    const span = getSpan();
    span?.setAttribute('id', user.id);
    const client = redis.getSingleton();
    const setAsync = promisify(client.set.bind(client));
    await setAsync(
      buildUserRedisKey(user.id),
      JSON.stringify(user),
      'EX',
      Number(process.env.REDIS_SESSION_TTL)
    );
  }

  @Trace({ name: 'user.delete' })
  static async delete(id: string) {
    if (!process.env.USE_REDIS) {
      delete users[id];
      return;
    }

    const span = getSpan();
    span?.setAttribute('id', id);
    const client = redis.getSingleton();
    const delAsync = promisify(client.del.bind(client));
    await delAsync(buildUserRedisKey(id));
  }
}

function buildUserRedisKey(userId: string) {
  return `${process.env.REDIS_NAMESPACE}:user:${userId}`;
}
