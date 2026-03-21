import type { Command, CommandContext } from "./types.ts";

const isTruthy = (v: string) => v !== "" && v !== "false" && v !== "0";

/** ((if cond then [else])) */
export const ifCmd: Command = {
  names: ["if"],
  execute: async (args, ctx: CommandContext) => {
    const cond = await ctx.evalToken(args[0] ?? "", ctx.vars);
    return isTruthy(cond)
      ? ctx.evalToken(args[1] ?? "", ctx.vars)
      : ctx.evalToken(args[2] ?? "", ctx.vars);
  },
};

/** ((eq a b)) — "true" if a === b */
export const eqCmd: Command = {
  names: ["eq"],
  execute: async (args, ctx: CommandContext) => {
    const a = await ctx.evalToken(args[0] ?? "", ctx.vars);
    const b = await ctx.evalToken(args[1] ?? "", ctx.vars);
    return a === b ? "true" : "false";
  },
};

/** ((not val)) — "true" if val is falsy */
export const notCmd: Command = {
  names: ["not"],
  execute: async (args, ctx: CommandContext) => {
    const val = await ctx.evalToken(args[0] ?? "", ctx.vars);
    return isTruthy(val) ? "false" : "true";
  },
};
