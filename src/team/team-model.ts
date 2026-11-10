import type { Selectable } from 'kysely';
import type { Team } from '../lib/db-types.ts';
import * as sqlite from '../lib/sqlite.ts';

/**
 * `team.id` is the primary key without an explicit `NOT NULL`, so sqlite
 * (and the generated types) technically allow `NULL` for it. We never
 * insert a team without an id.
 */
export type ITeam = Omit<Selectable<Team>, 'id'> & { id: string };

export const ChannelSettingKey = {
  PARTICIPANTS: 'participants',
  POINTS: 'points',
  PROTECTED: 'protected',
  AVERAGE: 'average',
  VOTING_DURATION: 'votingDuration',
} as const;

export type ChannelSettingKey =
  (typeof ChannelSettingKey)[keyof typeof ChannelSettingKey];

export class TeamStore {
  static async findById(id: string): Promise<ITeam | undefined> {
    const db = sqlite.getSingleton();
    const team = await db
      .selectFrom('team')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return team && { ...team, id };
  }

  static async upsert({
    id,
    name,
    access_token,
    scope,
    user_id,
  }: Pick<ITeam, 'id' | 'name' | 'access_token' | 'scope' | 'user_id'>) {
    const db = sqlite.getSingleton();
    const now = Date.now();
    await db
      .insertInto('team')
      .values({
        id,
        name,
        access_token,
        scope,
        user_id,
        created_at: now,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc
          .column('id')
          .doUpdateSet({ name, access_token, scope, user_id, updated_at: now })
      )
      .execute();
    return TeamStore.findById(id);
  }

  static async fetchSettings(teamId: string, channelId: string) {
    const db = sqlite.getSingleton();
    const settingRows = await db
      .selectFrom('channel_settings')
      .select(['setting_key', 'setting_value'])
      .where('team_id', '=', teamId)
      .where('channel_id', '=', channelId)
      .execute();

    const rv: { [key: string]: string } = {};
    settingRows.forEach((row) => {
      if (row.setting_value === null) return;
      rv[row.setting_key] = row.setting_value;
    });

    return rv;
  }

  static async upsertSettings(
    teamId: string,
    channelId: string,
    settings: { [key: string]: string }
  ) {
    const tasks = Object.entries(settings).map(([settingKey, settingValue]) =>
      TeamStore.upsertSetting(teamId, channelId, settingKey, settingValue)
    );
    await Promise.all(tasks);
  }

  static async upsertSetting(
    teamId: string,
    channelId: string,
    key: string,
    value: string
  ) {
    const db = sqlite.getSingleton();
    const now = Date.now();
    await db
      .insertInto('channel_settings')
      .values({
        team_id: teamId,
        channel_id: channelId,
        setting_key: key,
        setting_value: value,
        created_at: now,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc
          .columns(['team_id', 'channel_id', 'setting_key'])
          .doUpdateSet({ setting_value: value, updated_at: now })
      )
      .execute();
  }
}
