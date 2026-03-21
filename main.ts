/**
 * main.ts - CLI entry point of Parentino
 *
 * Usage:
 *   deno run -A main.ts [options] <template>
 *
 * Options:
 *   -v, --vars <file>      Load variables from JSON or YAML file (repeatable)
 *   -s, --set key=value    Set a single variable (repeatable)
 *   -o, --output <target>  Output target: - (stdout), file path, or URL
 *                          Default: stdout
 *
 * Template:
 *   File path or URL to a Markdown template.
 *
 * Examples:
 *   deno run -A main.ts -v vars.yaml template.md
 *   deno run -A main.ts -s name=World -o out.md template.md
 *   deno run -A main.ts -v https://example.com/vars.json https://example.com/tmpl.md
 */

import { loadVars } from "./vars.ts";
import { loadContent } from "./loader.ts";
import { render } from "./template.ts";
import { writeOutput } from "./output.ts";
import type { Delimiters } from "./parsers/tokeniser.ts";

const args = Deno.args;

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: deno run -A main.ts [options] <template>

Options:
  -v, --vars <file>      Load variables from JSON or YAML file (repeatable)
  -s, --set key=value    Set a single variable (repeatable)
  -o, --output <target>  Output: - (stdout, default), file path, or URL
  --open <str>           Opening delimiter (default: "((")
  --close <str>          Closing delimiter (default: "))")

Template: file path, URL, "-" or omit for stdin.

Syntax:
  ((= var))                    Output variable (dot-notation supported)
  ((define k v))               Define variable (no output)
  ((include uri))              Include and render another template
  ((if cond then [else]))      Conditional
  ((eq a b))                   "true" if a === b
  ((not val))                  "true" if falsy
  ((upper v)) / ((lower v))    Case conversion
  ((concat a b ...))           Concatenate strings
  ((quote ...))                Return operands as unevaluated template
  ((capture var)) ... ((end))  Store block as template variable
  ((with obj)) ... ((end))     Flatten object into scope
  ((each item list body))      Iterate over list
  '((a b c))                   Literal — escape with leading '
`);
  Deno.exit(0);
}

// Extract output target, and collect positional args (skip option values)
let outputTarget = "-";
let delimiters: Delimiters = { open: "((", close: "))" };
const filteredArgs: string[] = [];
const skipNext = new Set([
  "--output",
  "-o",
  "--vars",
  "-v",
  "--set",
  "-s",
  "--open",
  "--close",
]);
for (let i = 0; i < args.length; i++) {
  if ((args[i] === "--output" || args[i] === "-o") && args[i + 1]) {
    outputTarget = args[++i];
  } else if (args[i] === "--open" && args[i + 1]) {
    delimiters = { ...delimiters, open: args[++i] };
  } else if (args[i] === "--close" && args[i + 1]) {
    delimiters = { ...delimiters, close: args[++i] };
  } else if (
    skipNext.has(args[i]) && args[i] !== "--output" && args[i] !== "-o"
  ) {
    filteredArgs.push(args[i]);
    if (args[i + 1]) filteredArgs.push(args[++i]);
  } else {
    filteredArgs.push(args[i]);
  }
}

// Last positional argument (not an option flag or option value) is the template URI
const optionFlags = new Set(["--vars", "-v", "--set", "-s", "--output", "-o"]);
const positional: string[] = [];
for (let i = 0; i < filteredArgs.length; i++) {
  if (optionFlags.has(filteredArgs[i])) {
    i++;
    continue;
  } // skip flag + its value
  if (!filteredArgs[i].startsWith("-")) positional.push(filteredArgs[i]);
}
const templateUri = positional.at(-1);

const vars = await loadVars(filteredArgs);
const templateSrc = (templateUri && templateUri !== "-")
  ? await loadContent(templateUri)
  : await new Response(Deno.stdin.readable).text();
const output = await render(templateSrc, vars, delimiters);
await writeOutput(outputTarget, output);
