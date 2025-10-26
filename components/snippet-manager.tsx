"use client";

import { useState, useEffect, type FC } from "react";
import { abiDb } from "@/lib/abiDatabase";
import type { CodeSnippet } from "@/lib/abiDatabase";
import { ensureLatestSnippetDefaults, getCoreSnippetDefaults } from "@/lib/snippetStorage";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const FALLBACK_SNIPPETS: CodeSnippet[] = getCoreSnippetDefaults();

interface SnippetManagerProps {
    onSnippetInsert?: (snippet: CodeSnippet) => void;
}

export const SnippetManager: FC<SnippetManagerProps> = ({ onSnippetInsert }) => {
    const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
    const [previewSnippet, setPreviewSnippet] = useState<CodeSnippet | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const loadSnippets = async () => {
            try {
                await ensureLatestSnippetDefaults();
                const dbSnippets = await abiDb.snippets
                    .toArray();
                if (dbSnippets.length === 0) {
                    setSnippets(FALLBACK_SNIPPETS);
                } else {
                    setSnippets(dbSnippets);
                }
                setLoadError(null);
            } catch (error) {
                console.error("Failed to load snippets:", error);
                setSnippets(FALLBACK_SNIPPETS);
                setLoadError("Falling back to bundled snippets.");
            }
        };

        void loadSnippets();
    }, []);

    const handleInsert = (snippet: CodeSnippet) => {
        onSnippetInsert?.(snippet);
    };

    const summaryId = previewSnippet ? `snippet-preview-${previewSnippet.slug}-summary` : undefined;

    return (
        <div className="flex flex-col overflow-auto h-dvh w-full py-12 rounded-3xl border border-zinc-200/70 bg-white/70 shadow-lg shadow-zinc-200/40 backdrop-blur px-5 dark:border-zinc-700/60 dark:bg-zinc-900/70 dark:shadow-zinc-900/40">
            <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                    Snippet Library
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                        Quick-start blueprints
                    </h3>
                    <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        Curated viem patterns you can drop into the editor. Mix, match, and iterate.
                    </p>
                </div>
                {loadError && (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        {loadError}
                    </p>
                )}
            </div>

            <ScrollArea className="flex flex-col overflow-auto mt-4 h-full">
                <div className="flex flex-col space-y-2 pb-12 h-full w-full">
                    {snippets.map((snippet) => (
                        <div
                            key={snippet.slug}
                            className="group rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:hover:border-zinc-700"
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-base font-semibold text-zinc-900 line-clamp-1 dark:text-zinc-100">
                                                {snippet.title}
                                            </h4>
                                            <Badge
                                                variant="secondary"
                                                className="rounded-full bg-zinc-900/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-50 shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                                            >
                                                {snippet.category}
                                            </Badge>
                                        </div>
                                        {snippet.summary && (
                                            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                                                {snippet.summary}
                                            </p>
                                        )}
                                    </div>

                                </div>
                                <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-700">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="rounded-full border w-full border-zinc-300 hover:border-zinc-300 bg-zinc-900 hover:bg-zinc-900/5 text-xs font-semibold  transition text-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
                                        onClick={() => handleInsert(snippet)}
                                    >
                                        Insert
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="rounded-full border w-full border-transparent bg-zinc-900/5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-950 dark:bg-zinc-800/40 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                                        onClick={() => setPreviewSnippet(snippet)}
                                    >
                                        Preview
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {snippets.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
                            No snippets available yet.
                        </div>
                    )}
                </div>
            </ScrollArea>

            <Dialog open={Boolean(previewSnippet)} onOpenChange={() => setPreviewSnippet(null)}>
                <DialogContent
                    className="max-h-[60vh] sm:max-w-2xl"
                    aria-describedby={summaryId ?? "snippet-preview-fallback-description"}
                >
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {previewSnippet?.title}
                        </DialogTitle>
                        {previewSnippet?.summary ? (
                            <DialogDescription
                                id={summaryId}
                                className="text-sm text-zinc-600 dark:text-zinc-400"
                            >
                                {previewSnippet.summary}
                            </DialogDescription>
                        ) : (
                            <DialogDescription
                                id="snippet-preview-fallback-description"
                                className="sr-only"
                            >
                                Preview snippet source code before inserting into the editor.
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <pre className="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-950/95 p-4 text-xs text-zinc-100 shadow-inner dark:border-zinc-700">
                        <code>{previewSnippet?.content}</code>
                    </pre>
                    <div className="mt-4 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setPreviewSnippet(null)}>
                            Close
                        </Button>
                        {previewSnippet && (
                            <Button onClick={() => handleInsert(previewSnippet)}>Insert</Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
