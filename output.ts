/**
 * output.ts - Output sink abstraction (extensible)
 *
 * Supported targets:
 *   -            -> stdout (default)
 *   file://path  -> local file
 *   bare path    -> local file
 *   http(s)://   -> HTTP POST
 *
 * To add a new sink (e.g. s3://), implement the OutputSink interface and
 * register it in SINKS below.
 */

export interface OutputSink {
  canHandle(target: string): boolean;
  write(target: string, content: string): Promise<void>;
}

const stdoutSink: OutputSink = {
  canHandle: (target) => target === "-" || target === "",
  write: async (_target, content) => {
    await Deno.stdout.write(new TextEncoder().encode(content));
  },
};

const fileSink: OutputSink = {
  canHandle: (target) =>
    target.startsWith("file://") ||
    (!target.includes("://") && target !== "-" && target !== ""),
  write: async (target, content) => {
    const path = target.startsWith("file://")
      ? new URL(target).pathname
      : target;
    await Deno.writeTextFile(path, content);
  },
};

const httpSink: OutputSink = {
  canHandle: (target) =>
    target.startsWith("http://") || target.startsWith("https://"),
  write: async (target, content) => {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: content,
    });
    if (!res.ok) throw new Error(`HTTP POST ${res.status}: ${target}`);
  },
};

// Registry — add new sinks here
const SINKS: OutputSink[] = [stdoutSink, fileSink, httpSink];

export function registerSink(sink: OutputSink) {
  SINKS.unshift(sink);
}

export function writeOutput(target: string, content: string): Promise<void> {
  for (const sink of SINKS) {
    if (sink.canHandle(target)) return sink.write(target, content);
  }
  return Promise.reject(
    new Error(`No output sink found for target: ${target}`),
  );
}
