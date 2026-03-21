import type { Command, CommandContext } from "./types.ts";

/** ((upper val)) */
export const upperCmd: Command = {
  names: ["upper"],
  execute: async (args, ctx: CommandContext) =>
    (await ctx.evalToken(args[0] ?? "", ctx.vars)).toUpperCase(),
};

/** ((lower val)) */
export const lowerCmd: Command = {
  names: ["lower"],
  execute: async (args, ctx: CommandContext) =>
    (await ctx.evalToken(args[0] ?? "", ctx.vars)).toLowerCase(),
};

/** ((concat a b ...)) */
export const concatCmd: Command = {
  names: ["concat"],
  execute: async (args, ctx: CommandContext) =>
    (await Promise.all(args.map((t) => ctx.evalToken(t, ctx.vars)))).join(""),
};
