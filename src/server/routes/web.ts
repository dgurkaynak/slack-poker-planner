import * as express from 'express';
import logger from '../lib/logger';
import { TeamStore, ChannelSettingKey } from '../team/team-model';
import { generate as generateId } from 'shortid';
import { to } from '../lib/to';
import isString from 'lodash/isString';

import {
  SessionController,
  DEFAULT_POINTS,
} from '../session/session-controller';
import * as opentelemetry from '@opentelemetry/api';
import { Trace, getSpan } from '../lib/trace-decorator';

export class WebPokerRoute {
  /**
   * GET /slack/pp-command
   * GET /start-poker
   */
  static async handle(req: express.Request, res: express.Response) {
    const cmd = req.body;

    res.render('start', {
      layout: false,
      data: {
        teamName: 'markups',
      },
    });
  }
}
