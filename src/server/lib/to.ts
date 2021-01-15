/**
 * Inspired by
 * https://medium.com/javascript-in-plain-english/how-to-avoid-try-catch-statements-nesting-chaining-in-javascript-a79028b325c5
 */

export async function to<T>(promise: Promise<T>): Promise<[Error, T]> {
  try {
    return [undefined, await promise];
  } catch (err) {
    return [err, undefined];
  }
}
