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
        <div className="flex flex-col h-full bg-gray-900 text-green-400 font-mono text-sm overflow-hidden">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-2 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">CONSOLE</span>
                    <span className="text-xs text-gray-400">({logs.length} entries)</span>
                </div>
                {onClear && logs.length > 0 && (
                    <Button
                        onClick={onClear}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Log entries - Scrollable container */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {logs.length === 0 ? (
                    <div className="text-gray-500 italic">
                        No logs yet. Run some code to see output here.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {logs.map((log) => (
                            <div
                                key={`${log.key}-${log.timestamp}`}
                                className="flex items-start gap-2 p-1 rounded hover:bg-gray-800"
                            >
                                <span className="text-gray-500 text-xs shrink-0">
                                    {formatTimestamp(log.timestamp)}
                                </span>
                                <div className="flex-1 min-w-0 text-green-200 whitespace-pre-wrap wrap-break-word">
                                    {typeof log.formatted === "string" &&
                                        log.formatted.length > 0 ? (
                                        <span>{log.formatted}</span>
                                    ) : Array.isArray(log.args) && log.args.length > 0 ? (
                                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                                            {log.args.map((arg) => (
                                                <span key={arg?.toString() || ""}>{formatBrief(arg)}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span>{formatBrief(log.value)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsolePanel;
