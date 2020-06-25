import pino from 'pino';

const logger = pino({
  formatters: {
    level: (label, number) => ({ level: label }),
    bindings: (bindings) => ({}),
  },
});

export default logger;
