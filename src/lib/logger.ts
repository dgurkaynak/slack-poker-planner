import isObject from 'lodash/isObject';

export function info(message: string, ...args: any[]) {
  args[0] = `${new Date().toISOString()} - [info] ${message}`;
  args.forEach((arg, i) => {
    if (isObject(arg)) {
      args[i] = JSON.stringify(arg);
    }
  });
  console.log(...args);
}

export function warn(message: string, ...args: any[]) {
  args[0] = `${new Date().toISOString()} - [warn] ${message}`;
  args.forEach((arg, i) => {
    if (isObject(arg)) {
      args[i] = JSON.stringify(arg);
    }
  });
  console.warn(...args);
}

export function error(message: string, ...args: any[]) {
  args[0] = `${new Date().toISOString()} - [error] ${message}`;
  args.forEach((arg, i) => {
    if (isObject(arg)) {
      args[i] = JSON.stringify(arg);
    }
  });
  console.error(...args);
}
