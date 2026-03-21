import { assertEquals } from "@std/assert";
import { render } from "../parsers/parser.ts";
import { DEFAULT_DELIMITERS } from "../parsers/tokeniser.ts";

const r = (t: string, v = {}) => render(t, v, DEFAULT_DELIMITERS);

Deno.test("variable expansion", async () => {
  assertEquals(await r("((= name))", { name: "World" }), "World");
});

Deno.test("dot notation", async () => {
  assertEquals(await r("((= a.b))", { a: { b: "deep" } }), "deep");
});

Deno.test("nested expression", async () => {
  assertEquals(await r("((upper ((= name))))", { name: "world" }), "WORLD");
});

Deno.test("escape with leading quote", async () => {
  assertEquals(await r("'((= name))", { name: "World" }), "((= name))");
});

Deno.test("unknown operator passthrough", async () => {
  assertEquals(await r("((unknown foo))"), "((unknown foo))");
});

Deno.test("multiline expression", async () => {
  assertEquals(
    await r('((concat\n  "Hello, "\n  ((= name))\n  "!"\n))', {
      name: "World",
    }),
    "Hello, World!",
  );
});

Deno.test("custom delimiters", async () => {
  const d = { open: "{{", close: "}}" };
  assertEquals(await render("{{= name}}", { name: "World" }, d), "World");
});

Deno.test("custom delimiters do not match default", async () => {
  const d = { open: "{{", close: "}}" };
  assertEquals(await render("((= name))", { name: "World" }, d), "((= name))");
});
