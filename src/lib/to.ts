/**
 * Inspired by
 * https://medium.com/javascript-in-plain-english/how-to-avoid-try-catch-statements-nesting-chaining-in-javascript-a79028b325c5
 */

export async function to<T>(
  promise: Promise<T>
): Promise<[Error, undefined] | [undefined, T]> {
  try {
    return [undefined, await promise];
  } catch (err) {
    return [toError(err), undefined];
  }
}

/**
 * Anything can be thrown in javascript, normalizes it to an `Error`.
 */
export function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}
