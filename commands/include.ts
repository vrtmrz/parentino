import type { Command, CommandContext } from "./types.ts";
import { loadContent } from "../loader.ts";

/** ((include uri)) — load and render another template */
export const includeCmd: Command = {
  names: ["include"],
  execute: async (args, ctx: CommandContext) => {
    const uri = await ctx.evalToken(args[0] ?? "", ctx.vars);
    const src = await loadContent(uri);
    return ctx.render(src, ctx.vars);
  },
};
