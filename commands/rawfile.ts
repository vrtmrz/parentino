import type { Command, CommandContext } from "./types.ts";
import { loadContent } from "../loader.ts";

/** ((rawfile uri)) — load content without rendering */
export const rawfileCmd: Command = {
  names: ["rawfile"],
  execute: async (args, ctx: CommandContext) => {
    const uri = await ctx.evalToken(args[0] ?? "", ctx.vars);
    return await loadContent(uri);
  },
};
