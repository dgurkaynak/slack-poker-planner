import pino from 'pino';

const logger = pino({
  formatters: {
    level: (label, number) => ({ level: label }),
    bindings: (bindings) => ({}),
  },
  level: process.env.LOG_LEVEL || 'info',
});

export default logger;
