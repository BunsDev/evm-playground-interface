"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import Playground from "@/app/components/playground";
import { ABIManager } from "@/app/components/abi-manager";
import { Button } from "@/components/ui/button";
import { scriptDb } from "@/lib/abiDatabase";
import type { StoredScript } from "@/lib/abiDatabase";
import {
    getDefaultScriptContent,
    loadStoredScriptId,
    saveStoredScriptId,
} from "@/lib/scriptStorage";
import { Loader2, Plus, RefreshCw, SlidersHorizontal } from "lucide-react";

const WorkspacePage = () => {
    const [scripts, setScripts] = useState<StoredScript[]>([]);
    const [selectedScriptId, setSelectedScriptId] = useState<number | null>(null);
    const [isLoadingScripts, setIsLoadingScripts] = useState<boolean>(true);
    const [abiRefreshKey, setAbiRefreshKey] = useState(0);
    const [showAbiPanelMobile, setShowAbiPanelMobile] = useState(false);
    const [showScriptListMobile, setShowScriptListMobile] = useState(false);

    const timestampFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
        []
    );

    const formatUpdatedAt = useCallback(
        (value: Date | string) => timestampFormatter.format(new Date(value)),
        [timestampFormatter]
    );

    const loadScripts = useCallback(async () => {
        setIsLoadingScripts(true);
        try {
            const records = await scriptDb.scripts
                .orderBy("updatedAt")
                .reverse()
                .toArray();
            setScripts(records);
            setSelectedScriptId((current) => {
                const storedId = loadStoredScriptId();
                if (
                    storedId !== null &&
                    records.some((script) => script.id === storedId)
                ) {
                    return storedId;
                }
                if (current && records.some((script) => script.id === current)) {
                    return current;
                }
                const fallbackId = records[0]?.id ?? null;
                if (fallbackId === null) {
                    saveStoredScriptId(null);
                }
                return fallbackId;
            });
        } catch (error) {
            console.error("Failed to load scripts:", error);
            setScripts([]);
            setSelectedScriptId(null);
            saveStoredScriptId(null);
        } finally {
            setIsLoadingScripts(false);
        }
    }, []);

    useEffect(() => {
        void loadScripts();
    }, [loadScripts]);

    const selectedScript = useMemo(
        () => scripts.find((script) => script.id === selectedScriptId) ?? null,
        [scripts, selectedScriptId]
    );

    const handleSelectScript = useCallback((id: number | null) => {
        setSelectedScriptId(id);
        saveStoredScriptId(id);
        setShowScriptListMobile(false);
    }, []);

    const handleCreateScript = useCallback(async () => {
        const name = window
            .prompt("Script name", `Script ${scripts.length + 1}`)
            ?.trim();
        if (!name) return;

        const description = window.prompt("Description (optional)")?.trim();
        const now = new Date();

        try {
            const id = await scriptDb.scripts.add({
                name,
                description: description || undefined,
                content: getDefaultScriptContent(),
                createdAt: now,
                updatedAt: now,
            });
            await loadScripts();
            setSelectedScriptId(id);
            saveStoredScriptId(id);
        } catch (error) {
            console.error("Failed to create script:", error);
        }
    }, [loadScripts, scripts.length]);

    const handleDeleteScript = useCallback(
        async (id: number | undefined) => {
            if (!id) return;
            const confirmed = window.confirm("Delete this script? This action cannot be undone.");
            if (!confirmed) return;

            try {
                await scriptDb.scripts.delete(id);
                if (selectedScriptId === id) {
                    saveStoredScriptId(null);
                }
                await loadScripts();
            } catch (error) {
                console.error("Failed to delete script:", error);
            }
        },
        [loadScripts, selectedScriptId]
    );

    const handleAbiChange = useCallback(() => {
        setAbiRefreshKey((key) => key + 1);
        setShowAbiPanelMobile(false);
    }, []);

    const renderScriptList = useCallback(
        (className: string) => (
            <div className={className}>
                {isLoadingScripts ? (
                    <div className="flex items-center justify-center py-6 text-sm text-zinc-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2">Loading scripts…</span>
                    </div>
                ) : scripts.length === 0 ? (
                    <div className="space-y-3 px-4 py-6 text-sm text-zinc-500">
                        <p>No scripts yet.</p>
                        <p>Create your first script to save reusable playground templates.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-zinc-200">
                        {scripts.map((script) => {
                            const isActive = script.id === selectedScriptId;
                            return (
                                <li key={script.id}>
                                    <button
                                        type="button"
                                        onClick={() => script.id && handleSelectScript(script.id)}
                                        className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                                            isActive
                                                ? "bg-zinc-900 text-zinc-50"
                                                : "hover:bg-zinc-100"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold">
                                                {script.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    void handleDeleteScript(script.id);
                                                }}
                                                className="text-xs text-zinc-400 transition hover:text-red-500"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        {script.description && (
                                            <span className="text-xs text-zinc-500">
                                                {script.description}
                                            </span>
                                        )}
                                        <span className="text-xs text-zinc-400">
                                            Updated {formatUpdatedAt(script.updatedAt)}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        ),
        [
            formatUpdatedAt,
            handleDeleteScript,
            handleSelectScript,
            isLoadingScripts,
            scripts,
            selectedScriptId,
        ]
    );

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Workspace</h1>
                        <p className="mt-1 text-sm text-zinc-500">
                            Iterate on scripts, manage ABIs, and inspect execution results in one surface.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={handleCreateScript} className="gap-2">
                            <Plus className="h-4 w-4" />
                            New script
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2 md:hidden"
                            onClick={() => setShowScriptListMobile((prev) => !prev)}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Scripts
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2 lg:hidden"
                            onClick={() => setShowAbiPanelMobile((prev) => !prev)}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            ABI library
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden h-9 w-9 md:inline-flex"
                            onClick={() => void loadScripts()}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/** Mobile script drawer */}
            <section className="md:hidden">
                {showScriptListMobile && (
                    <div className="border-b border-zinc-200 bg-white">
                        <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-700">
                            <span>Script library</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-xs"
                                onClick={() => setShowScriptListMobile(false)}
                            >
                                Close
                            </Button>
                        </div>
                        {renderScriptList("max-h-72 overflow-y-auto")}
                    </div>
                )}
            </section>

            <div className="flex flex-1 justify-center">
                <div className="flex w-full max-w-[1400px] flex-1 overflow-hidden">
                    <aside className="hidden w-72 flex-col border-r border-zinc-200 bg-white md:flex">
                        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                            <div>
                                <h2 className="text-sm font-semibold text-zinc-800">Scripts</h2>
                                <p className="text-xs text-zinc-500">Dexie-backed local library</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => void loadScripts()}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {renderScriptList("")}
                        </div>
                    </aside>

                    <div className="flex min-w-0 flex-1 flex-col">
                        <Playground
                            abiRefreshKey={abiRefreshKey}
                            currentScript={selectedScript}
                        />
                        {showAbiPanelMobile && (
                            <div className="border-t border-zinc-200 bg-white p-4 lg:hidden">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-sm font-semibold text-zinc-800">ABI library</h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowAbiPanelMobile(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                                <ABIManager onABIChange={handleAbiChange} />
                            </div>
                        )}
                    </div>

                    <aside className="hidden w-96 border-l border-zinc-200 bg-white lg:block">
                        <div className="border-b border-zinc-200 px-4 py-3">
                            <h2 className="text-sm font-semibold text-zinc-800">ABI library</h2>
                            <p className="text-xs text-zinc-500">
                                Store contract interfaces for auto-completion and runtime helpers.
                            </p>
                        </div>
                        <div className="h-[calc(100%-3.25rem)] overflow-y-auto p-4">
                            <ABIManager onABIChange={handleAbiChange} />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default WorkspacePage;