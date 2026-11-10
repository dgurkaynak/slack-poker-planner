// The package ships types, but its `exports` map does not expose them.
declare module 'quoted-string-space-split' {
  export function splitSpacesExcludeQuotes(input: string): string[];
}
