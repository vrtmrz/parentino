/**
 * loader.ts - URI-based content loader (extensible)
 *
 * Supported schemes:
 *   file://  or bare path  -> local file
 *   http:// / https://     -> HTTP GET
 *
 * To add a new scheme (e.g. s3://), implement the Loader interface and
 * register it in LOADERS below.
 */

export interface Loader {
  canHandle(uri: string): boolean;
  load(uri: string): Promise<string>;
}

const fileLoader: Loader = {
  canHandle: (uri) => uri.startsWith("file://") || !uri.includes("://"),
  load: async (uri) => {
    const path = uri.startsWith("file://") ? new URL(uri).pathname : uri;
    return await Deno.readTextFile(path);
  },
};

const httpLoader: Loader = {
  canHandle: (uri) => uri.startsWith("http://") || uri.startsWith("https://"),
  load: async (uri) => {
    const res = await fetch(uri);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${uri}`);
    return await res.text();
  },
};

// Registry — add new loaders here
const LOADERS: Loader[] = [fileLoader, httpLoader];

export function registerLoader(loader: Loader) {
  LOADERS.unshift(loader); // higher priority
}

export function loadContent(uri: string): Promise<string> {
  for (const loader of LOADERS) {
    if (loader.canHandle(uri)) return loader.load(uri);
  }
  return Promise.reject(new Error(`No loader found for URI: ${uri}`));
}
