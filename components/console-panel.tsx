import { type FC, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { formatBrief } from "@/lib/valueRenderer";
import type { LogEntry } from "./playground";

interface ConsolePanelProps {
    logs: LogEntry[];
    isVisible?: boolean;
    onClear?: () => void;
}

/**
 * Lightweight log viewer that mirrors the in-iframe console output.
 */
const ConsolePanel: FC<ConsolePanelProps> = ({
    logs,
    isVisible = true,
    onClear,
}) => {
    // Reuse a single formatter instance to avoid recreating Intl objects every render.
    const timestampFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }),
        []
    );

    const formatTimestamp = (timestamp: number): string =>
        timestampFormatter.format(timestamp);

    if (!isVisible) return null;

    return (
        <div className="flex h-full flex-col rounded-3xl border border-zinc-200/80 bg-white/80 font-mono text-sm text-zinc-700 shadow-lg shadow-zinc-200/40 backdrop-blur dark:border-zinc-700/60 dark:bg-zinc-900/75 dark:text-zinc-200 dark:shadow-zinc-900/40">
            <div className="flex items-center justify-between border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-700/60">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                        Console
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-300 dark:text-zinc-500">
                        {logs.length} entries
                    </span>
                </div>
                {onClear && logs.length > 0 && (
                    <Button
                        onClick={onClear}
                        variant="outline"
                        size="sm"
                        className="rounded-full px-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                    >
                        Clear
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
                {logs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/70 px-4 py-6 text-center text-xs text-zinc-400 shadow-inner dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-500">
                        No logs yet. Run code to see output here.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log, index) => (
                            <div
                                key={`${log.key}-${log.timestamp}-${index}`}
                                className="flex flex-col gap-2 rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-700/60 dark:bg-zinc-900/70 dark:hover:border-zinc-600"
                            >
                                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                                    <span>{formatTimestamp(log.timestamp)}</span>
                                    <span className="text-zinc-300 dark:text-zinc-500">{log.key}</span>
                                </div>
                                <div className="text-sm text-zinc-700 dark:text-zinc-100">
                                    {typeof log.formatted === "string" && log.formatted.length > 0 ? (
                                        <span className="whitespace-pre-wrap">{log.formatted}</span>
                                    ) : Array.isArray(log.args) && log.args.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {log.args.map((arg) => (
                                                <span
                                                    key={arg?.toString() || ""}
                                                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-200"
                                                >
                                                    {formatBrief(arg)}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="whitespace-pre-wrap">{formatBrief(log.value)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ConsolePanel;
