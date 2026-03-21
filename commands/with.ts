import type { BlockCommand, Vars } from "./types.ts";

/** ((with objVar)) body ((end)) — flatten object keys into scope */
export const withCmd: BlockCommand = {
  names: ["with"],
  block: true,
  executeBlock: (args, body, ctx) => {
    const obj = ctx.vars[args[0]];
    const childVars: Vars = {
      ...ctx.vars,
      ...(obj != null && typeof obj === "object" ? obj as Vars : {}),
    };
    return ctx.render(body, childVars);
  },
};
