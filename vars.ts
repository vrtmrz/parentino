/**
 * vars.ts - Variable loading
 *
 * Sources (merged in order, later wins):
 *   1. JSON/YAML file via --vars / -v
 *   2. Inline key=value via --set / -s
 *
 * If a value starts with '@', the remainder is treated as a URI and the
 * content is loaded and assigned to the variable.
 */

import { parse as parseYaml } from "@std/yaml";
import { loadContent } from "./loader.ts";
import type { Vars } from "./template.ts";

async function expandAtValues(vars: Vars): Promise<void> {
  for (const [key, val] of Object.entries(vars)) {
    if (typeof val === "string" && val.startsWith("@")) {
      vars[key] = await loadContent(val.slice(1));
    }
  }
}

export async function loadVars(args: string[]): Promise<Vars> {
  const vars: Vars = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if ((arg === "--vars" || arg === "-v") && args[i + 1]) {
      const src = args[++i];
      const text = await loadContent(src);
      const parsed = src.endsWith(".json") ? JSON.parse(text) : parseYaml(text);
      Object.assign(vars, parsed);
    }

    if ((arg === "--set" || arg === "-s") && args[i + 1]) {
      const pair = args[++i];
      const eq = pair.indexOf("=");
      if (eq === -1) throw new Error(`--set requires key=value, got: ${pair}`);
      vars[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
  }

  await expandAtValues(vars);
  return vars;
}
