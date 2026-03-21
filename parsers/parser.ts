/**
 * parsers/parser.ts
 * Main template rendering engine.
 */

import { DEFAULT_DELIMITERS, findClose, tokenise } from "./tokeniser.ts";
import type { Delimiters } from "./tokeniser.ts";
import { getBlockCommand, getCommand } from "../commands/registry.ts";
import type { Vars } from "../commands/types.ts";

/** Resolve dot-notation path in vars */
function resolve(path: string, vars: Vars): unknown {
  const parts = path.split(".");
  let cur: unknown = vars;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function makeEvalToken(d: Delimiters) {
  return function evalToken(token: string, vars: Vars): Promise<string> {
    if (token.startsWith(d.open) && token.endsWith(d.close)) {
      const inner = token.slice(d.open.length, -d.close.length);
      return evalExpr(tokenise(inner.trim(), d), vars, inner, d);
    }
    const resolved = resolve(token, vars);
    return Promise.resolve(resolved != null ? String(resolved) : token);
  };
}

async function evalExpr(
  tokens: string[],
  vars: Vars,
  raw: string,
  d: Delimiters,
): Promise<string> {
  if (tokens.length === 0) return "";
  const evalToken = makeEvalToken(d);
  const [op, ...args] = tokens;
  const resolvedOp = op.startsWith(d.open) ? await evalToken(op, vars) : op;
  const rawArgs = raw ? raw.replace(/^\S+\s*/, "") : args.join(" ");

  const cmd = getCommand(resolvedOp);
  if (cmd) {
    return cmd.execute(args, {
      vars,
      render: (t, v) => render(t, v, d),
      evalToken,
      rawArgs,
    });
  }
  return `${d.open}${tokens.join(" ")}${d.close}`;
}

/**
 * Scan forward for the next `((end))` (or equivalent) at depth 0.
 * Returns [bodyText, indexAfterEnd].
 */
function scanUntilEnd(
  src: string,
  from: number,
  d: Delimiters,
): [string, number] {
  let i = from;
  while (i <= src.length - d.open.length) {
    if (src.startsWith(d.open, i)) {
      const closeAt = findClose(src, i + d.open.length, d);
      if (closeAt === -1) {
        i++;
        continue;
      }
      const inner = src.slice(i + d.open.length, closeAt - d.close.length)
        .trim();
      if (inner === "end") return [src.slice(from, i), closeAt];
      i = closeAt;
      continue;
    }
    i++;
  }
  return [src.slice(from), src.length];
}

/** Main render function */
export async function render(
  template: string,
  vars: Vars,
  d: Delimiters = DEFAULT_DELIMITERS,
): Promise<string> {
  const { open, close } = d;
  const evalToken = makeEvalToken(d);
  let result = "";
  let i = 0;

  while (i < template.length) {
    // Escape: '(( ... )) — leading ' outputs the tag literally
    if (template[i] === "'" && template.startsWith(open, i + 1)) {
      const openAt = i + 1;
      const closeAt = findClose(template, openAt + open.length, d);
      if (closeAt === -1) {
        result += template[i++];
        continue;
      }
      result += template.slice(openAt, closeAt);
      i = closeAt;
      continue;
    }

    // Expression: (( ... ))
    if (template.startsWith(open, i)) {
      const closeAt = findClose(template, i + open.length, d);
      if (closeAt === -1) {
        result += template[i++];
        continue;
      }
      const inner = template.slice(i + open.length, closeAt - close.length)
        .trim();
      const tokens = tokenise(inner, d);
      const op = tokens[0];

      // Block commands (capture, with, ...)
      const blockCmd = getBlockCommand(op);
      if (blockCmd) {
        const [body, afterEnd] = scanUntilEnd(template, closeAt, d);
        result += await blockCmd.executeBlock(
          tokens.slice(1),
          body.replace(/^\r?\n/, ""),
          {
            vars,
            render: (t, v) => render(t, v, d),
            evalToken,
            rawArgs: inner,
          },
        );
        i = afterEnd;
        continue;
      }

      result += await evalExpr(tokens, vars, inner, d);
      i = closeAt;
      continue;
    }

    result += template[i++];
  }

  return result;
}
