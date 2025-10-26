import { useState, useCallback, useEffect, type FC } from "react";
import { transpileCode } from "@/lib/esbuild";
import CodeEditor from "./code-editor";
import ConsolePanel from "./console-panel";
import { Play, Square, RotateCcw } from "lucide-react";
import { abiDb, scriptDb } from "@/lib/abiDatabase";
import type { StoredScript } from "@/lib/abiDatabase";
import { Button } from "@/components/ui/button";
import {
    loadStoredScript,
    saveStoredScript,
    loadStoredScriptId,
    saveStoredScriptId,
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
    currentScript?: StoredScript | null;
}

const Playground: FC<PlaygroundProps> = ({
    abiRefreshKey = 0,
    currentScript = null,
}) => {
    const VERBOSE_LOGS = false;
    const isTestEnv =
        typeof globalThis !== "undefined" &&
        Boolean((globalThis as Record<string, unknown>).__vitest_worker__);

    // initializes: code from script library || session storage
    const [code, setCode] = useState(() => {
        if (currentScript?.content) {
            return currentScript.content;
        }
        return loadStoredScript();
    });

    // loads: saved script ID on initialization
    const [savedScriptId, setSavedScriptId] = useState<number | null>(() => {
        return loadStoredScriptId();
    });

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showInlineLogs] = useState(true);

    const handleLog = useCallback((log: LogEntry) => {
        setLogs((prev) => [...prev, log]);
    }, []);

    // handles: script loading - prioritize script library over session storage
    useEffect(() => {
        const loadScriptContent = async () => {
            if (currentScript) {
                // current script from props takes priority
                setCode(currentScript.content);
                saveStoredScriptId(currentScript.id ?? null);
            } else if (savedScriptId && !currentScript) {
                // load saved script from database if we have an ID but no current script
                try {
                    const script = await scriptDb.scripts.get(savedScriptId);
                    if (script) {
                        setCode(script.content);
                    } else {
                        // script no longer exists: clear saved ID
                        setSavedScriptId(null);
                        saveStoredScriptId(null);
                        setCode(getDefaultScriptContent());
                    }
                } catch (error) {
                    console.error("Failed to load saved script:", error);
                    setSavedScriptId(null);
                    saveStoredScriptId(null);
                    setCode(getDefaultScriptContent());
                }
            } else {
                // no script selected: use session storage || default
                setCode(loadStoredScript());
            }
        };

        loadScriptContent();
    }, [currentScript, savedScriptId]);

    // auto-saves: script content when it changes
    useEffect(() => {
        if (currentScript && code !== currentScript.content) {
            const saveScript = async () => {
                try {
                    await scriptDb.scripts.update(currentScript.id!, {
                        content: code,
                        updatedAt: new Date(),
                    });
                } catch (error) {
                    console.error("Failed to save script:", error);
                }
            };
            saveScript();
        }
    }, [code, currentScript]);

    // auto-saves: to session storage for unsaved changes (when no script is selected)
    useEffect(() => {
        if (!currentScript) {
            saveStoredScript(code);
        }
    }, [code, currentScript]);

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

            // converts: console.log(...) to structured logs with args preserved
            instrumentedCode = instrumentedCode.replace(
                /console\.log\(([^)]*)\);?/g,
                '__log("console", [ $1 ]);'
            );

            // gets: ABIs for runtime injection
            const globalABIs: Record<string, any[]> = {};
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
          if (!['script','viem','user-code','success'].includes(key)) {
            try { console.log(key + ':', value); } catch (_) {}
          }
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
            }, 8000); 
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
        if (currentScript) {
            setCode(currentScript.content);
        } else {
            const defaultScript = getDefaultScriptContent();
            setCode(defaultScript);
            // clears: session storage when resetting to default
            saveStoredScript(defaultScript);
        }
        setLogs([]);
        setError(null);
        setIsRunning(false);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">EVM Playground</h1>
                    {currentScript ? (
                        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                            {currentScript.name}
                        </div>
                    ) : (
                        <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded border border-amber-200">
                            Unsaved Changes
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleRun}
                            disabled={isRunning}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play size={16} />
                            {isRunning ? "Running..." : "Run"}
                        </Button>
                        {isRunning && (
                            <Button
                                onClick={handleStop}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                <Square size={16} />
                                Stop
                            </Button>
                        )}
                        <Button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            <RotateCcw size={16} />
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="p-4 bg-red-50 border-b border-red-200">
                    <div className="flex items-center gap-2">
                        <div className="text-red-600 font-semibold">Error:</div>
                        <div className="text-red-800">{error}</div>
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
                {/* Editor panel */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
                    <div className="flex-shrink-0 p-2 bg-gray-100 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Editor</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
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

                {/* Console panel */}
                <div className="w-full md:w-96 h-64 md:h-auto flex flex-col overflow-hidden border-t md:border-t-0 md:border-l border-gray-200 shrink-0">
                    <ConsolePanel
                        logs={logs.filter((l) => l.source === "console")}
                        onClear={handleClearLogs}
                    />
                </div>
            </div>
        </div>
    );
};

export default Playground;
