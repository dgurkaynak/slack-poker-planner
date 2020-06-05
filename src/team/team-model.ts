import * as sqlite from '../lib/sqlite';

export interface ITeam {
  id: string;
  name: string;
  access_token: string;
  scope: string;
  user_id: string;
  custom_points: string;
}

export class TeamStore {
  static async findById(id: string): Promise<ITeam> {
    const db = sqlite.getSingleton();
    return db.get('SELECT * FROM team WHERE id = ?', id);
  }

  static async upsert(
    data: Pick<ITeam, 'id' | 'name' | 'access_token' | 'scope' | 'user_id'>
  ) {
    const db = sqlite.getSingleton();
    const team = await TeamStore.findById(data.id);
    if (!team) {
      await db.run(
        `INSERT INTO
          team (id, name, access_token, scope, user_id)
        VALUES
          ($id, $name, $access_token, $scope, $user_id)`,
        {
          $id: data.id,
          $name: data.name,
          $access_token: data.access_token,
          $scope: data.scope,
          $user_id: data.user_id,
        }
      );
    } else {
      await db.run(
        `UPDATE
          team
        SET
          name = $name,
          access_token = $access_token,
          scope = $scope,
          user_id = $user_id
        WHERE
          id = $id`,
        {
          $id: data.id,
          $name: data.name,
          $access_token: data.access_token,
          $scope: data.scope,
          $user_id: data.user_id,
        }
      );
    }
    return TeamStore.findById(data.id);
  }

  static async updateCustomPoints(teamId: string, customPoints: string) {
    const db = sqlite.getSingleton();
    const customPointsArr = customPoints.match(/\S+/g) || [];
    customPoints = customPointsArr.join(' ');
    if (!customPoints) customPoints = null;

    await db.run(
      `UPDATE
        team
      SET
        custom_points = $customPoints
      WHERE
        id = $id`,
      {
        $id: teamId,
        $customPoints: customPoints,
      }
    );
  }
}
