export function matchAll(str: string, regex: RegExp) {
  const res: string[] = [];
  let m: RegExpExecArray;
  if (regex.global) {
    while ((m = regex.exec(str))) {
      res.push(m[1]);
    }
  } else {
    if ((m = regex.exec(str))) {
      res.push(m[1]);
    }
  }
  return res;
}
