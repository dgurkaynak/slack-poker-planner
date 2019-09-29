const _ = require('lodash');


function info(...args) {
    const message = args[0];
    args[0] = `${new Date().toISOString()} - [info] ${message}`;
    args.forEach((arg, i) => {
        if (arg instanceof Error) {
            // Noop
        } else if (_.isObject(arg)) {
            args[i] = JSON.stringify(arg);
        }
    });
    console.log(...args);
}

function warn(...args) {
    const message = args[0];
    args[0] = `${new Date().toISOString()} - [warn] ${message}`;
    args.forEach((arg, i) => {
        if (arg instanceof Error) {
            // Noop
        } else if (_.isObject(arg)) {
            args[i] = JSON.stringify(arg);
        }
    });
    console.warn(...args);
}

function error(...args) {
    const message = args[0];
    args[0] = `${new Date().toISOString()} - [error] ${message}`;
    args.forEach((arg, i) => {
        if (arg instanceof Error) {
            // Noop
        } else if (_.isObject(arg)) {
            args[i] = JSON.stringify(arg);
        }
    });
    console.error(...args);
}

module.exports = {
    info,
    warn,
    error
};
