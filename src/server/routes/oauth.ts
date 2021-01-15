import * as express from 'express';
import { WebClient } from '@slack/web-api';
import logger from '../lib/logger';
import { TeamStore } from '../team/team-model';
import { generate as generateId } from 'shortid';
import { to } from '../lib/to';

export class OAuthRoute {
  /**
   * GET /oauth
   */
  static async handle(req: express.Request, res: express.Response) {
    // Slack-side error, display error message
    if (req.query.error) {
      logger.error({
        msg: `Could not oauth`,
        err: req.query.error,
      });
      return res.status(500).send(req.query.error);
    }

    // Installed!
    if (req.query.code) {
      const slackWebClient = new WebClient();
      const [oauthErr, accessResponse] = await to(
        slackWebClient.oauth.v2.access({
          client_id: process.env.SLACK_CLIENT_ID,
          client_secret: process.env.SLACK_CLIENT_SECRET,
          code: req.query.code as string,
        })
      );

      if (oauthErr) {
        const errorId = generateId();
        logger.error({
          msg: `Could not oauth, slack api call failed`,
          errorId,
          err: oauthErr,
        });
        return res
          .status(500)
          .send(
            `Internal server error, please try again (error code: ${errorId})\n\n` +
              `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`
          );
      }

      const [upsertErr, team] = await to(
        TeamStore.upsert({
          id: (accessResponse as any).team.id,
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
