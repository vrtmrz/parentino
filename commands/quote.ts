import type { Command } from "./types.ts";

/**
 * ((quote template-text))
 *
 * Returns the operands as an unevaluated template string.
 * Useful for passing a template body to ((each)) or ((define)) without
 * evaluating it at definition time.
 *
 * Example:
 *   ((define tmpl ((quote - ((= item.name)): ((if item.done "✅" "⬜"))))))
 *   ((each item items tmpl))
 *
 * Multi-line:
 *   ((define tmpl ((quote
 *     - ((= item.name))
 *     - score: ((= item.score))
 *   ))))
 */
export const quoteCmd: Command = {
  names: ["quote"],
  execute: (_args, ctx) => Promise.resolve(ctx.rawArgs),
};
