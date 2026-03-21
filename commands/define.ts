import type { Command, CommandContext } from "./types.ts";

/** ((define key value...)) — set a variable, no output */
export const defineCmd: Command = {
  names: ["define"],
  execute: async (args, ctx: CommandContext) => {
    const [key, ...rest] = args;
    ctx.vars[key] =
      (await Promise.all(rest.map((t) => ctx.evalToken(t, ctx.vars)))).join(
        " ",
      );
    return "";
  },
};
