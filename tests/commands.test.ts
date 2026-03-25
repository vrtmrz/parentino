import { assertEquals } from "@std/assert";
import { render } from "../parsers/parser.ts";
import { DEFAULT_DELIMITERS } from "../parsers/tokeniser.ts";

const d = DEFAULT_DELIMITERS;
const r = (t: string, v: Record<string, unknown> = {}) => render(t, v, d);

// --- output ---
Deno.test("= outputs variable", async () => {
  assertEquals(await r("((= x))", { x: "hi" }), "hi");
});

Deno.test("= missing variable returns empty", async () => {
  assertEquals(await r("((= x))"), "x");
});

// --- define ---
Deno.test("define sets variable", async () => {
  assertEquals(await r("((define x hello))((= x))"), "hello");
});

Deno.test("define with nested expr", async () => {
  assertEquals(await r('((define x ((upper "hi"))))((= x))'), "HI");
});

// --- if ---
Deno.test("if truthy", async () => {
  assertEquals(await r('((if flag "yes" "no"))', { flag: "true" }), "yes");
});

Deno.test("if falsy", async () => {
  assertEquals(await r('((if flag "yes" "no"))', { flag: "false" }), "no");
});

Deno.test("if missing else", async () => {
  assertEquals(await r('((if flag "yes"))', { flag: "false" }), "");
});

// --- eq ---
Deno.test("eq true", async () => {
  assertEquals(await r("((eq a b))", { a: "x", b: "x" }), "true");
});

Deno.test("eq false", async () => {
  assertEquals(await r("((eq a b))", { a: "x", b: "y" }), "false");
});

// --- not ---
Deno.test("not false -> true", async () => {
  assertEquals(await r("((not x))", { x: "false" }), "true");
});

Deno.test("not truthy -> false", async () => {
  assertEquals(await r("((not x))", { x: "yes" }), "false");
});

// --- upper / lower ---
Deno.test("upper", async () => {
  assertEquals(await r("((upper x))", { x: "hello" }), "HELLO");
});

Deno.test("lower", async () => {
  assertEquals(await r("((lower x))", { x: "HELLO" }), "hello");
});

// --- concat ---
Deno.test("concat", async () => {
  assertEquals(await r('((concat "a" "b" "c"))'), "abc");
});

// --- each ---
Deno.test("each over list", async () => {
  assertEquals(
    await r("((each x items ((= x))))", { items: ["a", "b", "c"] }),
    "abc",
  );
});

Deno.test("each with object items", async () => {
  assertEquals(
    await r("((each item items ((= item.name))))", {
      items: [{ name: "A" }, { name: "B" }],
    }),
    "AB",
  );
});

// --- capture ---
Deno.test("capture stores body", async () => {
  assertEquals(
    await r("((capture tmpl))\n- ((= x))\n((end))((each x items tmpl))", {
      items: ["a", "b"],
    }),
    "- a\n- b\n",
  );
});

// --- quote ---
Deno.test("quote returns raw template", async () => {
  assertEquals(
    await r("((define tmpl ((quote - ((= x))\n))))((each x items tmpl))", {
      items: ["a", "b"],
    }),
    "- a\n- b\n",
  );
});

// --- with ---
Deno.test("with flattens object scope", async () => {
  assertEquals(
    await r("((with obj))\n((= name))\n((end))", { obj: { name: "Alice" } }),
    "Alice\n",
  );
});

// --- include (file) ---
Deno.test("include renders file", async () => {
  const out = await r("((include tests/item.md))", {
    item: { name: "X", done: true },
  });
  assertEquals(out.replaceAll("\r\n", "\n"), "- X: ✅\n");
});

Deno.test("rawfile includes file without rendering", async () => {
  const out = await r("((rawfile tests/item.md))", {
    item: { name: "X", done: true },
  });
  assertEquals(
    out.replaceAll("\r\n", "\n"),
    '- ((= item.name)): ((if item.done "✅" "⬜"))\n',
  );
});

Deno.test("nop outputs empty string", async () => {
  assertEquals(await r("A((nop comment text))B"), "AB");
});
