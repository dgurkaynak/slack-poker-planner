import chalk from 'chalk';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';

export type Severity = 'info' | 'warning' | 'error';

export type Log = {
  msg: string;
  err?: Error;
  [key: string]: unknown;
};

class Logger {
  private isJSONLLoggingEnabled = false;

  public init() {
    this.isJSONLLoggingEnabled =
      process.env['ENABLE_JSONL_LOGGING']?.toLowerCase() === 'true';
  }

  public info(log: Log) {
    this.log({ ...log, level: 'info' });
  }

  public warning(log: Log) {
    this.log({ ...log, level: 'warning' });
  }

  public error(log: Log) {
    this.log({ ...log, level: 'error' });
  }

  private log(log: Log & { level: Severity }) {
    let logFn = console.log.bind(console);
    if (log.level === 'info') {
      logFn = console.info.bind(console);
    } else if (log.level === 'warning') {
      logFn = console.warn.bind(console);
    } else if (log.level === 'error') {
      logFn = console.error.bind(console);
    }

    if (this.isJSONLLoggingEnabled) {
      logFn(JSON.stringify({ ...log, ts: new Date().toISOString() }, replacer));
      return;
    }

    /////////////////////////////////////////////
    // Now, let's log in human readable format //
    /////////////////////////////////////////////

    const logLevelStyled =
      log.level === 'error'
        ? chalk.bgRed(`[${log.level}]`)
        : log.level === 'warning'
        ? chalk.bgYellow(`[${log.level}]`)
        : chalk.inverse(`[${log.level}]`);

    const extraPayload = omit(log, ['msg', 'level']);

    if (isEmpty(extraPayload)) {
      logFn(
        `${chalk.dim(new Date().toISOString())} - ${logLevelStyled} ${log.msg}`
      );
    } else {
      logFn(
        `${chalk.dim(new Date().toISOString())} - ${logLevelStyled} ${log.msg}`,
        JSON.stringify(extraPayload, replacer, 4)
      );
    }
  }
}

/**
 * A replacer function for JSON.stringify that handles Error objects properly.
 * Derived from: https://stackoverflow.com/a/18391400
 */
function replacer(_key: string | Symbol, value: unknown) {
  if (value instanceof Error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err: any = { name: value.name };

    Object.getOwnPropertyNames(value).forEach((propName) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      err[propName] = (value as any)[propName];
    });

    return err;
  }

  return value;
}

export const logger = new Logger();
