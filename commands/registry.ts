/**
 * commands/registry.ts
 * Central registry of all built-in commands.
 */

import type { BlockCommand, Command } from "./types.ts";
import { outputCmd } from "./output.ts";
import { defineCmd } from "./define.ts";
import { captureCmd } from "./capture.ts";
import { withCmd } from "./with.ts";
import { includeCmd } from "./include.ts";
import { eachCmd } from "./each.ts";
import { eqCmd, ifCmd, notCmd } from "./cond.ts";
import { concatCmd, lowerCmd, upperCmd } from "./string.ts";
import { quoteCmd } from "./quote.ts";

const commands = new Map<string, Command>();
const blockCommands = new Map<string, BlockCommand>();

function registerAll(list: (Command | BlockCommand)[]) {
  for (const cmd of list) {
    for (const name of cmd.names) {
      if ("block" in cmd) blockCommands.set(name, cmd);
      else commands.set(name, cmd as Command);
    }
  }
}

registerAll([
  outputCmd,
  defineCmd,
  captureCmd,
  withCmd,
  includeCmd,
  eachCmd,
  ifCmd,
  eqCmd,
  notCmd,
  upperCmd,
  lowerCmd,
  concatCmd,
  quoteCmd,
]);

export function registerCommand(cmd: Command | BlockCommand) {
  for (const name of cmd.names) {
    if ("block" in cmd) blockCommands.set(name, cmd);
    else commands.set(name, cmd as Command);
  }
}

export function getCommand(name: string): Command | undefined {
  return commands.get(name);
}

export function getBlockCommand(name: string): BlockCommand | undefined {
  return blockCommands.get(name);
}
