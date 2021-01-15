import { to } from '../lib/to';
import { Trace } from '../lib/trace-decorator';
import { UserStore } from './user-model';

export class UserController {
  @Trace()
  static async vote(sessionId: string, userId: string, point: string) {
    const [userErr, user] = await to(UserStore.findById(userId));
    user.votes[sessionId] = point;
    if (!!user.points[point]) {
      user.points[point] = 0;
    }
    user.points[point]++;
    await UserStore.upsert(user);
  }

  static async getAllVotes(sessionId: string, participants: string[]) {
    if (!participants) {
      return {};
    }

    const [usersErr, users] = await to(UserStore.findByIds(participants));

    if (!users) {
      return {};
    }
    const votes = users.reduce((acc, u) => {
      if (u && u.votes[sessionId]) {
        acc[u.id] = u.votes[sessionId];
      }
      return acc;
    }, {} as Record<string, string>);

    return votes;
  }
}
