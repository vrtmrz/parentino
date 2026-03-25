# Parentino

A simple CLI tool for expanding variables into Markdown templates. Built with
Deno.

## Usage

```sh
deno run -A main.ts [options] <template>
```

| Option                  | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `-v, --vars <file>`     | Load variables from a JSON or YAML file (repeatable) |
| `-s, --set key=value`   | Set a single variable inline (repeatable)            |
| `-o, --output <target>` | Output target; defaults to stdout                    |
| `--open <str>`          | Opening delimiter (default: `((`)                    |
| `--close <str>`         | Closing delimiter (default: `))`)                    |

The template argument accepts a file path, a URL, `-` for stdin, or may be
omitted entirely to read from stdin.

```sh
# Load variables from a file and write to stdout
deno run -A main.ts -v vars.yaml template.md

# Read the template from stdin
echo "Hello, ((= name))!" | deno run -A main.ts -s name=World

# Combine multiple sources and write to a file
deno run -A main.ts -v base.yaml -s name=World -o out.md template.md

# Fetch a template from a URL
deno run -A main.ts -v vars.json https://example.com/template.md

# Change delimiters (useful when the defaults conflict with Markdown)
deno run -A main.ts --open "{{" --close "}}" -s name=World template.md
```

## Template Language

### Basic Syntax

Expressions are wrapped in `(( operator operands... ))`. The default delimiters
are `((` and `))`. Newlines and indentation are freely permitted inside an
expression.

```
((= name))
((upper ((= name))))
((concat
  "Hello, "
  ((= name))
  "!"
))
```

Operands are whitespace-separated. String literals must be quoted.

```
((if flag "yes" "no"))
((concat "Hello, " ((= name)) "!"))
```

Prefixing an expression with `'` suppresses evaluation and outputs it literally.

```
'((= name))  →  ((= name))
```

### Nesting

Expressions may be nested to any depth. Any operand position accepts a nested
expression.

```
((upper ((= name))))
((if ((eq ((= status)) "done")) "✅" "⬜"))
((include ((= partialPath))))
```

### Command Reference

**Variables**

| Syntax                    | Description                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `((= var))`               | Expand a variable. Dot notation is supported for nested objects.                           |
| `((define key value...))` | Define a variable without producing output. Multiple value tokens are joined with a space. |

```
((= author.name))
((define greeting "Hello, World"))
((define msg ((concat "Hi, " ((= name))))))
```

**Control Flow**

| Syntax                    | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `((if cond then [else]))` | Evaluates `then` if `cond` is truthy, otherwise `else`.  |
| `((eq a b))`              | Returns `"true"` if `a === b`, otherwise `"false"`.      |
| `((not val))`             | Returns `"true"` if `val` is falsy, otherwise `"false"`. |

Falsy values: empty string, `"false"`, and `"0"`.

```
((if flag "enabled" "disabled"))
((if ((eq ((= role)) "admin")) "Admin" "User"))
((not ((eq ((= a)) ((= b))))))
```

**Iteration**

| Syntax                          | Description                                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `((capture var)) ... ((end))`   | Stores the block between `((capture))` and `((end))` as a template variable. Rendering is deferred.       |
| `((quote template-text))`       | Returns its operands as an unevaluated template string. Useful with `define` for inline body definitions. |
| `((each itemVar listVar body))` | Iterates over the array in `listVar`, binding each element to `itemVar` and evaluating `body`.            |
| `((with objVar)) ... ((end))`   | Flattens the keys of `objVar` into the scope for the duration of the block.                               |

Both `capture` and `quote` produce deferred templates. `capture` is more
readable for multi-line bodies, whilst `quote` is convenient for inline
definitions.

```
((capture tmpl))
- ((= item.name)): ((if item.done "✅" "⬜"))
((end))
((each item items tmpl))
```

```
((define tmpl ((quote
  - ((= item.name)): ((if item.done "✅" "⬜"))
))))
((each item items tmpl))
```

The `body` argument to `each` also accepts an inline expression directly.

```
((each tag tags ((= tag))))
```

**Includes**

| Syntax            | Description                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `((include uri))` | Loads the template at `uri`, renders it with the current variable scope, and splices the result inline. |
| `((rawfile uri))` | Loads content at `uri` and splices it inline without rendering.                                         |

The URI may be a file path or a URL. The included template is fully evaluated.
Combine with `each` to use partials.

```
((include partials/header.md))
((each item items ((include partials/item.md))))

((rawfile docs/static.md))
```

**Comments / no-op**

| Syntax        | Description                                              |
| ------------- | -------------------------------------------------------- |
| `((nop ...))` | Outputs nothing; useful for inline template comments.    |

```
((nop this note will not be rendered))
```

**Strings**

| Syntax               | Description                       |
| -------------------- | --------------------------------- |
| `((upper val))`      | Converts `val` to upper case.     |
| `((lower val))`      | Converts `val` to lower case.     |
| `((concat a b ...))` | Concatenates two or more strings. |

```
((upper ((= name))))
((concat ((= first)) " " ((= last))))
```

## Variables

### Loading from Files

Both YAML and JSON are supported. The `-v` flag may be repeated; later files
take precedence over earlier ones.

```yaml
# vars.yaml
title: My Document
author:
  name: Alice
  role: Engineer
tags:
  - TypeScript
  - Deno
```

### Loading External Content

Prefixing a value with `@` causes the tool to fetch the content at that URI and
assign it to the variable.

```yaml
body: @./content.md
remote: @https://example.com/data.txt
```

### Inline Assignment

```sh
deno run -A main.ts -s title="Hello" -s name=Alice template.md
```

## Output Targets

| Target          | Behaviour              |
| --------------- | ---------------------- |
| `-` (default)   | Write to stdout.       |
| File path       | Write to a local file. |
| `http(s)://...` | HTTP POST to the URL.  |

## Extension

### Custom Loader (e.g. S3)

Implement the `Loader` interface from `loader.ts` and register it with
`registerLoader`.

```ts
import { registerLoader } from "./loader.ts";

registerLoader({
  canHandle: (uri) => uri.startsWith("s3://"),
  load: async (uri) => {/* ... */},
});
```

### Custom Output Sink

Implement the `OutputSink` interface from `output.ts` and register it with
`registerSink`.

```ts
import { registerSink } from "./output.ts";

registerSink({
  canHandle: (target) => target.startsWith("s3://"),
  write: async (target, content) => {/* ... */},
});
```

### Custom Commands

Create a file under `commands/`, implement `Command` or `BlockCommand`, and add
it to the `registerAll` list in `commands/registry.ts`.

Standard command (`Command`):

```ts
// commands/trim.ts
import type { Command } from "./types.ts";

export const trimCmd: Command = {
  names: ["trim"],
  execute: async (args, ctx) =>
    (await ctx.evalToken(args[0] ?? "", ctx.vars)).trim(),
};
```

Block command (`BlockCommand`) — receives the body up to `((end))`:

```ts
// commands/repeat.ts
import type { BlockCommand } from "./types.ts";

export const repeatCmd: BlockCommand = {
  names: ["repeat"],
  block: true,
  executeBlock: async (args, body, ctx) => {
    const n = parseInt(await ctx.evalToken(args[0], ctx.vars)) || 0;
    return (await Promise.all(
      Array.from({ length: n }, () => ctx.render(body, ctx.vars)),
    )).join("");
  },
};
```

Both types are activated simply by adding them to the `registerAll` list in
`commands/registry.ts`.

## Tests

```sh
deno task test
```

- `tests/parser.test.ts` — core parser behaviour and custom delimiters
- `tests/commands.test.ts` — full coverage of all built-in commands
