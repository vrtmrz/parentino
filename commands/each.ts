import type { Command, CommandContext, Vars } from "./types.ts";

/**
 * ((each itemVar listVar body))
 *
 * Iterates over the array at `listVar`, binding each element to `itemVar`,
 * then evaluates `body` (a single token — a ((...)) expr, a captured variable
 * name, or an include) for each element.
 *
 * Typical usage with capture:
 *   ((capture tmpl))
 *   - ((= item.name)): ((if item.done "✅" "⬜"))
 *   ((end))
 *   ((each item items tmpl))
 */
export const eachCmd: Command = {
  names: ["each"],
  execute: async (args, ctx: CommandContext) => {
    const [itemVar, listToken, bodyToken] = args;
    // Support dot-notation for the list variable
    const listVal = listToken.includes(".")
      ? listToken.split(".").reduce<unknown>(
        (cur, p) =>
          cur != null && typeof cur === "object"
            ? (cur as Record<string, unknown>)[p]
            : undefined,
        ctx.vars,
      )
      : ctx.vars[listToken];
    const list = Array.isArray(listVal) ? listVal : [];
    const parts: string[] = [];

    for (const item of list) {
      const childVars: Vars = { ...ctx.vars, [itemVar]: item };
      // body may be a captured template string variable or a (( )) expression
      const bodyVal = ctx.vars[bodyToken];
      if (typeof bodyVal === "string") {
        parts.push(await ctx.render(bodyVal, childVars));
      } else {
        parts.push(await ctx.evalToken(bodyToken ?? "", childVars));
      }
    }
    return parts.join("");
  },
};
