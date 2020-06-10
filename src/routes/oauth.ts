import * as express from 'express';
import { WebClient } from '@slack/web-api';
import logger from '../lib/logger';
import Countly from 'countly-sdk-nodejs';
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
      logger.error(`Could not oauth, req.query.error: ${req.query.error}`);
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
        logger.error(
          `(${errorId}) Could not oauth, slack api call failed`,
          oauthErr
        );
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
        logger.error(
          `(${errorId}) Could not oauth, sqlite upsert failed - ${upsertErr.message}`,
          upsertErr
        );
        res
          .status(500)
          .send(
            `Internal server error, please try again later (error code: ${errorId})\n\n` +
              `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`
          );
      }

      if (process.env.COUNTLY_APP_KEY) {
        Countly.add_event({
          key: 'added_to_team',
          count: 1,
          segmentation: {},
        });
      }

      logger.info(
        `Added to team "${team.name}"(${team.id}) by ${team.user_id}`
      );

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
    logger.error(`(${errorId}) Could not oauth, unknown error`, req.query);
    return res
      .status(500)
      .send(
        `Unknown error (error code: ${errorId})\n\n` +
          `If this problem is persistent, you can open an issue on <${process.env.ISSUES_LINK}>`
      );
  }
}
