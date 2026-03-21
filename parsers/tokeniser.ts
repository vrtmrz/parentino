/**
 * parsers/tokeniser.ts
 * Low-level scanning and tokenisation utilities.
 */

export interface Delimiters {
  open: string; // default "(("
  close: string; // default "))"
}

export const DEFAULT_DELIMITERS: Delimiters = { open: "((", close: "))" };

/**
 * Scan forward from `pos` to find the matching close delimiter,
 * respecting nesting. Returns the index just after the close, or -1.
 */
export function findClose(src: string, pos: number, d: Delimiters): number {
  const { open, close } = d;
  let depth = 1;
  while (pos <= src.length - close.length) {
    if (src.startsWith(open, pos)) {
      depth++;
      pos += open.length;
      continue;
    }
    if (src.startsWith(close, pos)) {
      depth--;
      pos += close.length;
      if (depth === 0) return pos;
      continue;
    }
    pos++;
  }
  return -1;
}

/**
 * Tokenise an expression body.
 * Splits on whitespace, respects "quoted strings" and nested delimiters as single tokens.
 */
export function tokenise(expr: string, d: Delimiters): string[] {
  const { open } = d;
  const tokens: string[] = [];
  let cur = "";
  let i = 0;
  while (i < expr.length) {
    if (expr.startsWith(open, i)) {
      const closeAt = findClose(expr, i + open.length, d);
      if (closeAt !== -1) {
        if (cur) {
          tokens.push(cur);
          cur = "";
        }
        tokens.push(expr.slice(i, closeAt));
        i = closeAt;
        continue;
      }
    }
    const ch = expr[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      while (i < expr.length && expr[i] !== q) cur += expr[i++];
      i++;
      continue;
    }
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      if (cur) {
        tokens.push(cur);
        cur = "";
      }
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur) tokens.push(cur);
  return tokens;
}
