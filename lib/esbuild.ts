import * as esbuild from "esbuild-wasm";
import type { OnLoadResult, Plugin } from "esbuild-wasm";
import { DEFAULT_RPC_URL } from "./runtimeConfig";

let esbuildInitialized = false;

const DEFAULT_CDN_ORIGIN = "https://esm.sh/";

/**
 * Bootstraps the WASM-powered esbuild runtime once per session.
 */
export const initializeEsbuild = async (): Promise<void> => {
  if (esbuildInitialized) return;

  try {
    await esbuild.initialize({
      wasmURL: "https://esm.sh/esbuild-wasm@0.25.11/esbuild.wasm",
      worker: true,
    });
    esbuildInitialized = true;
  } catch (error) {
    console.error("Failed to initialize esbuild:", error);
    throw error;
  }
};

// Minimal HTTP/ESM CDN resolver for browser builds
function httpPlugin(cdnBase: string = DEFAULT_CDN_ORIGIN): Plugin {
  return {
    name: "http-plugin",
    setup(build) {
      // Pass-through absolute URLs (external CDNs, pre-signed assets, etc.)
      build.onResolve({ filter: /^(https?:)?\/\// }, (args) => {
        return { path: args.path, namespace: "http-url" };
      });
      // Resolve absolute paths relative to importer origin (e.g., "/pkg@version/file.js" returned by CDNs)
      build.onResolve({ filter: /^\// }, (args) => {
        const base =
          args.importer && /^https?:/.test(args.importer)
            ? args.importer
            : cdnBase;
        const url = new URL(args.path, base);
        return { path: url.toString(), namespace: "http-url" };
      });
      // Resolve relative paths from a fetched URL
      build.onResolve({ filter: /^\.\.?(\/|$)/ }, (args) => {
        const importer = args.importer;
        const url = new URL(args.path, importer);
        return { path: url.toString(), namespace: "http-url" };
      });
      // Resolve bare specifiers via CDN (exclude entry and already-handled cases)
      build.onResolve({ filter: /.*/ }, (args) => {
        const p = args.path;
        if (
          p === "<stdin>" ||
          p.startsWith("\0") ||
          p.startsWith("/") ||
          p.startsWith(".") ||
          /^https?:\/\//.test(p)
        ) {
          return; // let esbuild handle or other resolvers catch
        }
        // Prefer CDN pre-bundled entries for viem and subpaths to reduce graph
        if (p === "viem" || p.startsWith("viem/")) {
          return {
            path: `${cdnBase}${p}?bundle&target=es2022`,
            namespace: "http-url",
          };
        }
        return { path: cdnBase + p, namespace: "http-url" };
      });
      // Load fetched contents
      build.onLoad({ filter: /.*/, namespace: "http-url" }, async (args) => {
        const res = await fetch(args.path);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch ${args.path} (status ${res.status} ${res.statusText})`
          );
        }
        const contents = await res.text();
        let loader: esbuild.Loader = "js";
        if (args.path.endsWith(".ts")) loader = "ts";
        else if (args.path.endsWith(".tsx")) loader = "tsx";
        else if (args.path.endsWith(".mjs")) loader = "js";
        else if (args.path.endsWith(".cjs")) loader = "js";
        else if (args.path.endsWith(".json")) loader = "json";
        // Provide a resolveDir so further relative imports are resolved against this URL
        const resolveDir = new URL("./", args.path).toString();
        const result: OnLoadResult = { contents, loader, resolveDir };
        return result;
      });
    },
  };
}

/**
 * Transpiles user-authored scripts (potentially TypeScript) into ESM fit for sandbox execution.
 */
export type TranspileOptions = {
  rpcUrl?: string;
};

const createViemClientVirtualModule = (rpcUrl: string): Plugin => {
  const moduleId = "viem-playground-client";

  return {
    name: "viem-playground-client-virtual-module",
    setup(build) {
      build.onResolve({ filter: /^viem-playground-client$/ }, (args) => ({
        path: args.path,
        namespace: moduleId,
      }));

      build.onLoad({ filter: /.*/, namespace: moduleId }, () => ({
        contents: `import { createPublicClient, defineChain, http } from "viem";

type PublicClientConfig = Parameters<typeof createPublicClient>[0];
type PublicClient = ReturnType<typeof createPublicClient>;
type ConfigurePublicClientOptions = Partial<PublicClientConfig> & {
  rpcUrl?: string;
};

const initialRpcUrl = ${JSON.stringify(rpcUrl)};
let currentRpcUrl = initialRpcUrl;
export let rpcUrl = currentRpcUrl;

const baseChain = defineChain({
  id: 1,
  name: "Custom RPC",
  network: "custom",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [initialRpcUrl] },
    public: { http: [initialRpcUrl] },
  },
});

export const defaultChain = baseChain;

const initialChain = baseChain;
let currentChain = initialChain;
export let chain = currentChain;

const initialTransport = http(initialRpcUrl);
let currentTransport = initialTransport;
export let transport = currentTransport;

let currentClient: PublicClient = createPublicClient({
  chain: currentChain,
  transport: currentTransport,
});
export let publicClient = currentClient;

export const getRpcUrl = () => currentRpcUrl;
export const getChain = () => currentChain;
export const getTransport = () => currentTransport;
export const getPublicClient = () => publicClient;

export const configurePublicClient = (
  options: ConfigurePublicClientOptions = {}
) => {
  const { rpcUrl: rpcUrlOverride, ...configOverrides } = options;
  const trimmedRpcUrl = rpcUrlOverride?.trim();

  if (trimmedRpcUrl && trimmedRpcUrl.length > 0) {
    currentRpcUrl = trimmedRpcUrl;
    rpcUrl = currentRpcUrl;
  }

  const transportOverride =
    configOverrides.transport ??
    (trimmedRpcUrl && trimmedRpcUrl.length > 0
      ? http(currentRpcUrl)
      : undefined);

  if (transportOverride) {
    currentTransport = transportOverride;
    transport = currentTransport;
  }

  if (configOverrides.chain) {
    currentChain = configOverrides.chain;
  } else if (trimmedRpcUrl && trimmedRpcUrl.length > 0) {
    currentChain = {
      ...currentChain,
      rpcUrls: {
        default: { http: [currentRpcUrl] },
        public: { http: [currentRpcUrl] },
      },
    };
  }
  chain = currentChain;

  const nextConfig: PublicClientConfig = {
    ...configOverrides,
    chain: currentChain,
    transport: currentTransport,
  };

  currentClient = createPublicClient(nextConfig);
  publicClient = currentClient;
  return publicClient;
};

export const resetPublicClient = () => {
  currentRpcUrl = initialRpcUrl;
  rpcUrl = currentRpcUrl;
  currentChain = initialChain;
  chain = currentChain;
  currentTransport = http(initialRpcUrl);
  transport = currentTransport;
  currentClient = createPublicClient({
    chain: currentChain,
    transport: currentTransport,
  });
  publicClient = currentClient;
  return publicClient;
};
`,
        loader: "ts",
      }));
    },
  };
};

export const transpileCode = async (
  code: string,
  options: TranspileOptions = {}
): Promise<string> => {
  await initializeEsbuild();

  try {
    const { rpcUrl = DEFAULT_RPC_URL } = options;

    const stdinPlugin: Plugin = {
      name: "stdin-plugin",
      setup(build) {
        // Provide a virtual entry module backed by `code`
        build.onResolve({ filter: /^stdin-entry$/ }, () => ({
          path: "stdin-entry",
          namespace: "stdin",
        }));
        build.onLoad({ filter: /^stdin-entry$/, namespace: "stdin" }, () => ({
          contents: code,
          loader: "ts",
          resolveDir: "/",
          pluginData: {},
        }));
      },
    };

    const result = await esbuild.build({
      entryPoints: ["stdin-entry"],
      bundle: true,
      write: false,
      format: "esm",
      target: "esnext",
      plugins: [stdinPlugin, createViemClientVirtualModule(rpcUrl), httpPlugin()],
      outdir: "out",
      entryNames: "app",
      absWorkingDir: "/",
      define: {
        // Make sure global is available
        global: "globalThis",
      },
      platform: "browser",
    });

    if (result.outputFiles && result.outputFiles.length > 0) {
      const primary =
        result.outputFiles.find((f) => /\/?out\/app\.js$/.test(f.path)) ||
        result.outputFiles.find((f) => f.path.endsWith(".js"));
      if (primary) return primary.text;
    }

    throw new Error("No output generated");
  } catch (error) {
    console.error("Transpilation error:", error);
    throw error;
  }
};

// Create a bundled version with viem included
/**
 * Produces an isolated runtime bundle that preloads viem and injects tracking helpers.
 */
export const createRuntimeBundle = async (
  userCode: string
): Promise<string> => {
  await initializeEsbuild();

  const runtimeCode = `
    // Runtime globals
    window.__logs = [];
    window.__log = function(key, value) {
      window.__logs.push({ key, value, timestamp: Date.now() });
      console.log(key + ':', value);
    };

    window.getInput = async function(key) {
      // This will be implemented when we add widget support
      return null;
    };

    // User code
    ${userCode}
  `;

  try {
    const result = await esbuild.build({
      bundle: true,
      write: false,
      format: "iife",
      target: "es2020",
      outfile: "runtime.js",
      stdin: {
        contents: runtimeCode,
        resolveDir: "/",
        sourcefile: "runtime.tsx",
        loader: "tsx",
      },
      define: {
        global: "globalThis",
      },
    });

    if (result.outputFiles && result.outputFiles.length > 0) {
      const primary =
        result.outputFiles.find((f) => f.path.endsWith("runtime.js")) ||
        result.outputFiles[0];
      return primary.text;
    }

    throw new Error("No runtime bundle generated");
  } catch (error) {
    console.error("Runtime bundle error:", error);
    throw error;
  }
};
