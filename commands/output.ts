import type { Command } from "./types.ts";

/** ((= var)) — output a variable or expression */
export const outputCmd: Command = {
  names: ["="],
  execute: (args, ctx) => ctx.evalToken(args[0] ?? "", ctx.vars),
};
