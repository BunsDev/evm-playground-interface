import { useState, useCallback, useEffect, useRef, type FC } from "react";
import { transpileCode } from "@/lib/esbuild";
import CodeEditor from "./code-editor";
import ConsolePanel from "./console-panel";
import { Play, Square, RotateCcw } from "lucide-react";
import { abiDb } from "@/lib/abiDatabase";
import type { CodeSnippet } from "@/lib/abiDatabase";
import { Button } from "@/components/ui/button";
import {
    loadStoredScript,
    saveStoredScript,
    getDefaultScriptContent,
} from "@/lib/scriptStorage";

export interface LogEntry {
    key: string;
    value: unknown;
    timestamp: number;
    source?: "console" | "inline" | "system";
    // for console logs
    formatted?: string;
    args?: unknown[];
}

interface PlaygroundProps {
    abiRefreshKey?: number;
    pendingSnippet?: CodeSnippet | null;
    onSnippetConsumed?: () => void;
}

const Playground: FC<PlaygroundProps> = ({
    abiRefreshKey = 0,
    pendingSnippet = null,
    onSnippetConsumed,
}) => {
    const VERBOSE_LOGS = false;
    const isTestEnv =
        typeof globalThis !== "undefined" &&
        Boolean((globalThis as Record<string, unknown>).__vitest_worker__);

    // initializes: default startup code or locally persisted content
    const [code, setCode] = useState(() => {
        const stored = loadStoredScript();
        return stored || getDefaultScriptContent();
    });

    const isResettingRef = useRef(false);

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showInlineLogs] = useState(true);

    const handleLog = useCallback((log: LogEntry) => {
        setLogs((prev) => [...prev, log]);
    }, []);

    useEffect(() => {
        if (!pendingSnippet) return;

        setCode((prev: string) => {
            const base = prev ?? "";
            const needsSeparator = base.trim().length > 0 && !base.endsWith("\n\n");
            const separator = needsSeparator ? "\n\n" : base.endsWith("\n") ? "\n" : "";
            return `${base}${separator}${pendingSnippet.content}`;
        });

        onSnippetConsumed?.();
    }, [pendingSnippet, onSnippetConsumed]);

    useEffect(() => {
        if (isResettingRef.current) {
            isResettingRef.current = false;
            return;
        }
        saveStoredScript(code);
    }, [code]);

    const handleError = useCallback((error: Error) => {
        setError(error.message);
        setIsRunning(false);
    }, []);

    const handleRun = async () => {
        if (isRunning) return;

        setIsRunning(true);
        setLogs([]);
        setError(null);

        try {
            if (VERBOSE_LOGS)
                handleLog({ key: "run", value: "Started", timestamp: Date.now() });

            // uses (for meow): simple approach that works with the iframe sandbox
            // TODO: improve this later with proper bundling

            // transpiles user code (TypeScript) to JavaScript via esbuild
            const compiledUserCode = await transpileCode(code);

            if (isTestEnv) {
                handleLog({
                    key: "success",
                    value: "Execution skipped in test environment",
                    timestamp: Date.now(),
                    source: "system",
                });
                setIsRunning(false);
                return;
            }

            // extracts: declared variable names from the original user code only
            const extractUserVarNames = (src: string): Set<string> => {
                const names = new Set<string>();
                try {
                    // Simple declarations: const/let/var foo = ...
                    const declRegex =
                        /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
                    let m: RegExpExecArray | null;
                    while ((m = declRegex.exec(src))) {
                        names.add(m[1]);
                    }
                    // destructure: const { a, b: c } = ...  -> capture a and c
                    const destrRegex = /\b(?:const|let|var)\s*\{([^}]+)\}\s*=\s*[^;\n]+/g;
                    let dm: RegExpExecArray | null;
                    while ((dm = destrRegex.exec(src))) {
                        const inner = dm[1];
                        inner
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .forEach((piece) => {
                                // handle aliases like b: c
                                const alias = piece.split(":").map((x) => x.trim());
                                const name = alias[1] || alias[0];
                                if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) names.add(name);
                            });
                    }
                } catch (_) { }
                return names;
            };

            const userVarNames = Array.from(extractUserVarNames(code));

            // instruments: compiled JS, but only for variables declared in the user's source
            let instrumentedCode = compiledUserCode;
            if (VERBOSE_LOGS) {
                console.debug("[playground] compiled user code:\n", compiledUserCode);
            }
            if (userVarNames.length > 0) {
                const nameAlternation = userVarNames
                    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                    .join("|");
                const declAssignRe = new RegExp(
                    String.raw`(\b(?:const|let|var)\s+(${nameAlternation})\s*=\s*[^;]+;)`,
                    "g"
                );
                instrumentedCode = instrumentedCode.replace(
                    declAssignRe,
                    (_m, stmt, varName) => `${stmt}\n__log("${varName}", ${varName});`
                );

                // destructures: only log variables in our set
                const destrRe = /(\b(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*[^;]+;)/g;
                instrumentedCode = instrumentedCode.replace(
                    destrRe,
                    (_m, stmt, vars) => {
                        const candidates = String(vars)
                            .split(",")
                            .map((v) => v.trim())
                            .map((piece) => {
                                const alias = piece.split(":").map((x) => x.trim());
                                return alias[1] || alias[0];
                            })
                            .filter(
                                (v) =>
                                    /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(v) &&
                                    userVarNames.includes(v)
                            );
                        const logs = candidates
                            .map((n) => `__log("${n}", ${n});`)
                            .join("\n");
                        return logs ? `${stmt}\n${logs}` : stmt;
                    }
                );
            }

            if (VERBOSE_LOGS) {
                console.debug("[playground] instrumented code:\n", instrumentedCode);
            }

            // gets: ABIs for runtime injection
            const globalABIs: Record<string, unknown> = {};
            const storedABIs = await abiDb.abis.toArray();
            storedABIs.forEach((abi) => {
                globalABIs[abi.name] = abi.abi;
            });

            // creates: runtime prelude code (no viem wait needed when bundling)
            const runtimeCode = `
        // Set up logging first
        window.__logs = window.__logs || [];
        window.__safeSerialize = function(value) {
          const maxDepth = 3;
          const seen = new WeakSet();
          const inner = (val, depth) => {
            if (depth > maxDepth) return '[MaxDepth]';
            const type = typeof val;
            if (val === null || type === 'string' || type === 'number' || type === 'boolean') return val;
            if (type === 'bigint') return { __type: 'bigint', value: val.toString() };
            if (type === 'function') return { __type: 'function', name: val.name || 'anonymous' };
            if (type === 'symbol') return { __type: 'symbol', value: String(val) };
            if (val instanceof Error) return { __type: 'Error', name: val.name, message: val.message, stack: val.stack };
            if (val instanceof Date) return { __type: 'Date', value: val.toISOString() };
            if (Array.isArray(val)) return val.map((item) => inner(item, depth + 1));
            if (val && type === 'object') {
              if (seen.has(val)) return '[Circular]';
              seen.add(val);
              const out = {};
              try {
                const keys = Object.keys(val).slice(0, 50);
                for (const key of keys) {
                  try {
                    out[key] = inner(val[key], depth + 1);
                  } catch (e) {
                    out[key] = '[Unserializable]';
                  }
                }
              } catch (_) {
                return String(val);
              }
              return out;
            }
            try { return JSON.parse(JSON.stringify(val)); } catch (_) { return String(val); }
          };
          return inner(value, 0);
        };
        // Basic console format substitution similar to DevTools
        window.__formatConsole = function(args) {
          try {
            if (!args || args.length === 0) return '';
            const [first, ...rest] = args;
            if (typeof first !== 'string') return null;
            let i = 0;
            const out = first.replace(/%[sdifoOc]/g, (match) => {
              const next = rest[i++];
              switch (match) {
                case '%s': return String(next);
                case '%d':
                case '%i': return Number(next).toString();
                case '%f': return Number(next).toString();
                case '%o':
                case '%O': return (typeof next === 'object') ? JSON.stringify(next) : String(next);
                case '%c': return '';
                default: return match;
              }
            });
            const remaining = rest.slice(i).map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ');
            return remaining ? (out + ' ' + remaining) : out;
          } catch (_) { return null; }
        };

        window.__log = function(key, value) {
          const isConsole = key === 'console';
          const rawArgs = isConsole && Array.isArray(value) ? value : undefined;
          const formatted = isConsole ? window.__formatConsole(rawArgs) : undefined;
          const safeValue = window.__safeSerialize(value);
          const safeArgs = rawArgs ? rawArgs.map(window.__safeSerialize) : undefined;
          const log = { key, value: safeValue, timestamp: Date.now(), source: isConsole ? 'console' : 'inline', formatted, args: safeArgs };
          window.__logs.push(log);
          window.parent.postMessage({ type: 'LOG', payload: log }, '*');
          // Avoid noisy console mirroring for internal keys
          if (!['script','viem','user-code','success','console'].includes(key) && window.__originalConsoleLog) {
            try { window.__originalConsoleLog(key + ':', value); } catch (_) {}
          }
        };

        window.__originalConsoleLog = console.log.bind(console);
        console.log = function(...args) {
          try {
            window.__log('console', args);
          } catch (_) {}
          try {
            window.__originalConsoleLog(...args);
          } catch (_) {}
        };

        // Forward runtime errors to the parent so they appear in the UI
        window.addEventListener('error', (event) => {
          try {
            const message = (event && (event.error && event.error.message)) || event.message || 'Script error';
            window.parent.postMessage({ type: 'ERROR', payload: message }, '*');
          } catch (_) {}
        });
        window.addEventListener('unhandledrejection', (event) => {
          try {
            const reason = event && event.reason;
            const message = (reason && (reason.message || String(reason))) || 'Unhandled promise rejection';
            window.parent.postMessage({ type: 'ERROR', payload: message }, '*');
          } catch (_) {}
        });

        window.__log('script', 'Runtime prelude ready');
      `;

            // executes: in iframe context with proper setup
            const iframe = document.createElement("iframe");
            iframe.style.display = "none";
            iframe.sandbox = "allow-scripts allow-same-origin";

            // sets up: iframe with basic HTML first; we'll load our local shim next
            iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Sandbox</title>
          </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
      `;

            let iframeLoadTimeoutId: number | undefined;
            const iframeLoadPromise = new Promise<void>((resolve, reject) => {
                iframe.onload = () => {
                    if (VERBOSE_LOGS)
                        handleLog({
                            key: "iframe",
                            value: "Iframe loaded successfully",
                            timestamp: Date.now(),
                        });
                    try {
                        const iframeDoc =
                            iframe.contentDocument || iframe.contentWindow?.document;
                        if (!iframeDoc) {
                            handleLog({
                                key: "error",
                                value: "Could not access iframe document",
                                timestamp: Date.now(),
                            });
                            reject(new Error("Could not access iframe document"));
                            return;
                        }

                        // injects: runtime prelude (classic script)
                        const runtimePrelude = iframeDoc.createElement("script");
                        runtimePrelude.type = "text/javascript";
                        runtimePrelude.textContent = runtimeCode;
                        iframeDoc.body.appendChild(runtimePrelude);

                        // injects: global ABIs before user code
                        const globalABIsScript = iframeDoc.createElement("script");
                        globalABIsScript.type = "text/javascript";
                        globalABIsScript.textContent = `
              window.__globalABIs = ${JSON.stringify(globalABIs)};
              // Make ABIs available globally
              Object.entries(window.__globalABIs).forEach(([name, abi]) => {
                window[name] = abi;
              });
            `;
                        iframeDoc.body.appendChild(globalABIsScript);

                        // injects: user bundle as ESM (supports top-level await). It will execute immediately.
                        const userModule = iframeDoc.createElement("script");
                        userModule.type = "module";
                        userModule.textContent = instrumentedCode;
                        iframeDoc.body.appendChild(userModule);

                        if (VERBOSE_LOGS)
                            handleLog({
                                key: "iframe",
                                value: "Runtime prelude + user module added",
                                timestamp: Date.now(),
                            });

                        try {
                            if (iframeLoadTimeoutId) clearTimeout(iframeLoadTimeoutId);
                        } catch (_) { }
                        resolve();
                    } catch (error) {
                        handleLog({
                            key: "error",
                            value: `Iframe setup error: ${error}`,
                            timestamp: Date.now(),
                        });
                        reject(error);
                    }
                };

                iframe.onerror = () => {
                    handleLog({
                        key: "error",
                        value: "Iframe failed to load",
                        timestamp: Date.now(),
                    });
                    reject(new Error("Failed to load iframe"));
                };

                // timeouts: after 5 seconds for iframe loading (viem loading happens separately)
                iframeLoadTimeoutId = window.setTimeout(() => {
                    handleLog({
                        key: "error",
                        value: "Iframe load timeout",
                        timestamp: Date.now(),
                    });
                    reject(new Error("Iframe load timeout"));
                }, 5000);
            });

            if (VERBOSE_LOGS)
                handleLog({
                    key: "iframe",
                    value: "Iframe added to DOM",
                    timestamp: Date.now(),
                });
            document.body.appendChild(iframe);
            await iframeLoadPromise;

            // listens: for messages from iframe
            const messageHandler = (event: MessageEvent) => {
                if (event.source !== iframe.contentWindow) return;

                if (event.data.type === "LOG") {
                    const log = event.data.payload as LogEntry;
                    const internalKeys = new Set([
                        "run",
                        "script",
                        "viem",
                        "user-code",
                        "success",
                        "iframe",
                        "error",
                    ]);
                    if (internalKeys.has(log.key)) return;
                    handleLog(log);
                } else if (event.data.type === "ERROR") {
                    handleError(new Error(event.data.payload));
                }
            };

            window.addEventListener("message", messageHandler);

            // cleans up: after execution
            setTimeout(() => {
                window.removeEventListener("message", messageHandler);
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
                setIsRunning(false);
                // allows: 8 seconds for execution
            }, 8_000);
        } catch (err) {
            console.error("Execution error:", err);
            handleError(err as Error);
            setIsRunning(false);
        }
    };

    const handleStop = () => {
        setIsRunning(false);
        setError(null);
    };

    const handleClearLogs = () => {
        setLogs([]);
        setError(null);
    };

    const handleReset = () => {
        const defaultCode = getDefaultScriptContent();
        isResettingRef.current = true;
        setCode(defaultCode);
        saveStoredScript(defaultCode);
        setLogs([]);
        setError(null);
    };

    return (
        <div className="relative flex h-screen w-full bg-linear-to-br from-zinc-100 via-white to-zinc-50 text-zinc-900 dark:from-zinc-950 dark:via-zinc-950/95 dark:to-zinc-900 dark:text-zinc-50">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,244,255,0.6),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(63,63,96,0.35),transparent_55%)]" />
            <div className="relative mx-auto flex w-full flex-col gap-6 px-6 py-8 lg:max-w-6xl lg:px-10">
                <header className="rounded-3xl border border-zinc-200/80 bg-white/75 px-6 py-6 shadow-lg shadow-zinc-200/50 backdrop-blur dark:border-zinc-700/60 dark:bg-zinc-900/70 dark:shadow-zinc-900/40">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                                Local workspace
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                                    Playground
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                                    Prototype viem flows, inspect state, and compose snippets in a dedicated EVM workspace.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Button
                                onClick={handleRun}
                                disabled={isRunning}
                                size="lg"
                                className="rounded-full bg-zinc-950 px-6 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                <Play className="h-4 w-4" />
                                {isRunning ? "Running..." : "Run code"}
                            </Button>
                            {isRunning && (
                                <Button
                                    onClick={handleStop}
                                    variant="destructive"
                                    size="lg"
                                    className="rounded-full px-5 text-sm font-semibold uppercase tracking-[0.12em]"
                                >
                                    <Square className="h-4 w-4" />
                                    Stop
                                </Button>
                            )}
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                size="lg"
                                className="rounded-full px-5 text-sm font-semibold uppercase tracking-[0.12em]"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset
                            </Button>
                            <Button
                                onClick={handleClearLogs}
                                variant="ghost"
                                size="lg"
                                className="rounded-full px-5 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                            >
                                Clear logs
                            </Button>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="rounded-2xl border border-red-200/70 bg-red-50/90 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100">
                        {error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="rounded-3xl border border-zinc-200/80 bg-white/80 shadow-lg shadow-zinc-200/40 backdrop-blur dark:border-zinc-700/60 dark:bg-zinc-900/70 dark:shadow-zinc-900/40">
                        <div className="flex items-center justify-between border-b border-zinc-200/70 px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-700/60 dark:text-zinc-400">
                            <span>Editor Surface</span>
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">abi refresh #{abiRefreshKey}</span>
                        </div>
                        <div className="h-[min(60vh,540px)] lg:h-[620px]">
                            <CodeEditor
                                key={abiRefreshKey}
                                value={code}
                                onChange={(value) => setCode(value || "")}
                                height="100%"
                                logs={logs.filter((l) => l.source === "inline")}
                                showInlineLogs={showInlineLogs}
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-200/80 bg-zinc-950/90 text-zinc-100 shadow-xl shadow-zinc-900/40 backdrop-blur lg:h-[620px] dark:border-zinc-800/70">
                        <ConsolePanel
                            logs={logs.filter((l) => l.source === "console")}
                            onClear={handleClearLogs}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Playground;
