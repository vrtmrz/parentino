import type { BlockCommand, CommandContext } from "./types.ts";

/** ((capture varname)) body ((end)) — store body as unevaluated template */
export const captureCmd: BlockCommand = {
  names: ["capture"],
  block: true,
  executeBlock: (args, body, ctx: CommandContext) => {
    ctx.vars[args[0]] = body;
    return Promise.resolve("");
  },
};
