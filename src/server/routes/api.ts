import * as express from 'express';
import { WebClient } from '@slack/web-api';
import logger from '../lib/logger';
import { TeamStore } from '../team/team-model';
import { generate as generateId } from 'shortid';
import { to } from '../lib/to';

export class OAuthRoute {
  /**
   * GET /web
   */
  static async handle(req: express.Request, res: express.Response) {
    
    if(req.query.team) {
      const [upsertErr, team] = await to(
        TeamStore.upsert({
          id: .team.id,
          name: (accessResponse as any).team.name,
          access_token: (accessResponse as any).access_token,
          scope: (accessResponse as any).scope,
          user_id: (accessResponse as any).authed_user.id,
        })
      );

      if (upsertErr) {
        const errorId = generateId();
        logger.error({
          msg: `Could not oauth, sqlite upsert failed`,
          errorId,
          err: upsertErr,
        });
        res
          .status(500)
          .send(
            `Internal server error, please try again later (error code: ${errorId})\n\n` +
              `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`
          );
      }

      logger.info({
        msg: `Added to team`,
        team,
      });

      return res.render('oauth-success', {
        layout: false,
        data: {
          SLACK_APP_ID: process.env.SLACK_APP_ID,
          TEAM_NAME: team.name,
        },
      });
    }

    // Unknown error
    const errorId = generateId();
    logger.error({
      msg: `Could not oauth, unknown error`,
      errorId,
      query: req.query,
    });
    return res
      .status(500)
      .send(
        `Unknown error (error code: ${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`
      );
  }
}
