import { AsyncLocalStorage } from 'async_hooks';
import * as opentelemetry from '@opentelemetry/api';

const asyncLocalStorage = new AsyncLocalStorage<{
  span: opentelemetry.Span;
}>();

export function Trace(
  options: {
    name?: string;
  } = {}
) {
  return (
    target: any,
    propertyName: string,
    propertyDesciptor: TypedPropertyDescriptor<any>
  ) => {
    const originalMethod = propertyDesciptor.value;
    const spanName = options.name || `${target.name}.${propertyName}`;

    // Replace the method
    propertyDesciptor.value = function (...args: any[]) {
      const tracer = opentelemetry.trace.getTracer('default');
      const ctx = asyncLocalStorage.getStore();
      const spanOptions: opentelemetry.SpanOptions = {};

      if (ctx) {
        spanOptions.parent = ctx.span;
      }

      // Start a new span for the method
      const span = tracer.startSpan(spanName, spanOptions);

      // Execute original method
      try {
        const rv: any = asyncLocalStorage.run({ span }, () =>
          originalMethod.apply(this, args)
        );

        // Auto finish is on, check return value is promise
        // Instead of `instanceof` check, prefer checking `.then()` method exists on object.
        // User may be using custom promise polyfill (https://stackoverflow.com/a/27746324)
        if (typeof rv == 'object' && rv.then && rv.catch) {
          return rv
            .then((val: any) => {
              // Promise resolved
              span.end();
              return val;
            })
            .catch((err: any) => {
              // Promise is rejected
              // https://github.com/opentracing/specification/blob/master/semantic_conventions.md
              span.addEvent('error', {
                event: 'error',
                error: err.message,
                message: err.message,
                stack: err.stack,
                'error.kind': err.name,
              });
              span.setStatus({
                code: opentelemetry.CanonicalCode.UNKNOWN,
                message: err.message,
              });
              span.end();
              throw err;
            });
        }

        // If return value is not promise, finish and return
        span.end();
        return rv;
      } catch (err) {
        // Method throwed an error
        // https://github.com/opentracing/specification/blob/master/semantic_conventions.md
        span.addEvent('error', {
          event: 'error',
          error: err.message || err.name,
          message: err.message,
          stack: err.stack,
          'error.kind': err.name,
        });
        span.setStatus({
          code: opentelemetry.CanonicalCode.UNKNOWN,
          message: err.message,
        });
        span.end();
        throw err;
      }
    };

    return propertyDesciptor;
  };
}

export function getSpan() {
  const ctx = asyncLocalStorage.getStore();
  return ctx?.span;
}
