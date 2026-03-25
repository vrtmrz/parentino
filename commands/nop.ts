import type { Command } from "./types.ts";

/** ((nop ...)) — no operation, always outputs empty string */
export const nopCmd: Command = {
  names: ["nop"],
  execute: async () => "",
};
