import * as sqlite from '../lib/sqlite';
import { Trace, getSpan } from '../lib/trace-decorator';

export interface ITeam {
  id: string;
  name: string;
  access_token: string;
  scope: string;
  user_id: string;
  custom_points: string;
}

export enum ChannelSettingKey {
  PARTICIPANTS = 'participants',
  POINTS = 'points',
  PROTECTED = 'proctected',
}

export interface IChannelSetting {
  team_id: string;
  channel_id: string;
  setting_key: string;
  setting_value: string;
}

export class TeamStore {
  @Trace()
  static async findById(id: string): Promise<ITeam> {
    const span = getSpan();
    span?.setAttribute('id', id);
    const db = sqlite.getSingleton();
    return db.get('SELECT * FROM team WHERE id = ?', id);
  }

  @Trace()
  static async create({
    id,
    name,
    access_token,
    scope,
    user_id,
  }: Pick<ITeam, 'id' | 'name' | 'access_token' | 'scope' | 'user_id'>) {
    const span = getSpan();
    span?.setAttributes({ id, name, scope, user_id });
    const db = sqlite.getSingleton();
    await db.run(
      `INSERT INTO
          team (id, name, access_token, scope, user_id)
        VALUES
          ($id, $name, $access_token, $scope, $user_id)`,
      {
        $id: id,
        $name: name,
        $access_token: access_token,
        $scope: scope,
        $user_id: user_id,
      }
    );
  }

  @Trace()
  static async update({
    id,
    name,
    access_token,
    scope,
    user_id,
  }: Pick<ITeam, 'id' | 'name' | 'access_token' | 'scope' | 'user_id'>) {
    const span = getSpan();
    span?.setAttributes({ id, name, scope, user_id });
    const db = sqlite.getSingleton();
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
        $id: id,
        $name: name,
        $access_token: access_token,
        $scope: scope,
        $user_id: user_id,
      }
    );
  }

  @Trace()
  static async upsert({
    id,
    name,
    access_token,
    scope,
    user_id,
  }: Pick<ITeam, 'id' | 'name' | 'access_token' | 'scope' | 'user_id'>) {
    const span = getSpan();
    span?.setAttributes({ id, name, scope, user_id });
    const team = await TeamStore.findById(id);
    if (!team) {
      await TeamStore.create({ id, name, access_token, scope, user_id });
    } else {
      await TeamStore.update({ id, name, access_token, scope, user_id });
    }
    return TeamStore.findById(id);
  }

  @Trace()
  static async fetchSettings(teamId: string, channelId: string) {
    const span = getSpan();
    span?.setAttributes({ teamId, channelId });
    const db = sqlite.getSingleton();
    const settingRows = await db.all(
      `SELECT
        setting_key,
        setting_value
      FROM
        channel_settings
      WHERE
        team_id = $teamId AND
        channel_id = $channelId;`,
      {
        $teamId: teamId,
        $channelId: channelId,
      }
    );

    const rv: { [key: string]: string } = {};
    settingRows.forEach((row: IChannelSetting) => {
      rv[row.setting_key] = row.setting_value;
    });

    return rv;
  }

  @Trace()
  static async upsertSettings(
    teamId: string,
    channelId: string,
    settings: { [key: string]: string }
  ) {
    const tasks = Object.keys(settings).map((settingKey) =>
      TeamStore.upsertSetting(
        teamId,
        channelId,
        settingKey,
        settings[settingKey]
      )
    );
    await Promise.all(tasks);
  }

  @Trace()
  static async upsertSetting(
    teamId: string,
    channelId: string,
    key: string,
    value: string
  ) {
    const span = getSpan();
    span?.setAttributes({ teamId, channelId, key, value });
    const db = sqlite.getSingleton();
    await db.run(
      `INSERT INTO
        channel_settings (team_id, channel_id, setting_key, setting_value)
      VALUES (
        $teamId,
        $channelId,
        $settingKey,
        $settingValue
      )
      ON CONFLICT(team_id, channel_id, setting_key)
      DO UPDATE SET setting_value = $settingValue;`,
      {
        $teamId: teamId,
        $channelId: channelId,
        $settingKey: key,
        $settingValue: value,
      }
    );
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
