/**
 * commands/types.ts
 * Shared types for the command system.
 */

export type Vars = Record<string, unknown>;

export interface CommandContext {
  vars: Vars;
  /** Render a template string with the current vars (injected by parser) */
  render: (template: string, vars: Vars) => Promise<string>;
  /** Evaluate a single token (nested expr or variable/literal) */
  evalToken: (token: string, vars: Vars) => Promise<string>;
  /** Raw inner text of the expression (after the operator), preserving whitespace */
  rawArgs: string;
}

export interface Command {
  /** Operator name(s) this command handles */
  names: string[];
  /**
   * Execute the command.
   * @param args  remaining tokens after the operator
   * @param ctx   rendering context
   */
  execute(args: string[], ctx: CommandContext): Promise<string>;
}

export interface BlockCommand {
  /** Operator name(s) this block command handles */
  names: string[];
  /** Marks this as a block-level command (parsed by the parser, not evalExpr) */
  block: true;
  /**
   * Execute the block command.
   * @param args    tokens after the operator (e.g. variable name)
   * @param body    raw template text between open tag and ((end))
   * @param ctx     rendering context
   */
  executeBlock(
    args: string[],
    body: string,
    ctx: CommandContext,
  ): Promise<string>;
}
