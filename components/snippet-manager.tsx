"use client";

import { useState, useEffect, type FC } from "react";
import { abiDb } from "@/lib/abiDatabase";
import type { CodeSnippet } from "@/lib/abiDatabase";
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

const FALLBACK_SNIPPETS: CodeSnippet[] = [
    {
        id: 1,
        slug: "erc20-abi-definition",
        title: "Define a minimal ERC-20 ABI",
        category: "utility",
        summary: "Reusable constant exporting a small ERC-20 ABI shape.",
        content: `import type { Abi } from "viem";

export const erc20Minimal: Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
];
`,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 2,
        slug: "setup-public-client",
        title: "Create a viem public client",
        category: "setup",
        summary: "Bootstrap a viem public client pointed at Ethereum mainnet.",
        content: `import { createPublicClient, http } from "viem";
import { publicActions } from "viem/actions";
import { mainnet } from "viem/chains";

export const client = createPublicClient({
  chain: mainnet,
  transport: http("https://eth.llamarpc.com"),
}).extend(publicActions);
`,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 3,
        slug: "erc20-read-balance",
        title: "Read ERC-20 balance",
        category: "read",
        summary: "Calls balanceOf using the minimal ERC-20 ABI.",
        content: `import { client } from "./setup-public-client";
import { erc20Minimal } from "./erc20-abi-definition";

export async function readBalance(holder: string) {
  const balance = await client.readContract({
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    abi: erc20Minimal,
    functionName: "balanceOf",
    args: [holder],
  });

  console.log("Balance:", balance);
}
`,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 4,
        slug: "erc20-transfer",
        title: "Send ERC-20 transfer",
        category: "write",
        summary: "Illustrates how to craft a transfer transaction using viem.",
        content: `import { createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";
import { erc20Minimal } from "./erc20-abi-definition";

const walletClient = createWalletClient({
  account: "0x...", // replace with signer address
  chain: mainnet,
  transport: http("https://eth.llamarpc.com"),
});

export async function transfer(to: string, amount: bigint) {
  const txHash = await walletClient.writeContract({
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    abi: erc20Minimal,
    functionName: "transfer",
    args: [to, amount],
  });

  console.log("Submitted tx:", txHash);
}
`,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

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
                const dbSnippets = await abiDb.snippets.toArray();
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

    return (
        <div className="flex h-full flex-col rounded-3xl border border-zinc-200/70 bg-white/70 shadow-lg shadow-zinc-200/40 backdrop-blur px-5 py-6 dark:border-zinc-700/60 dark:bg-zinc-900/70 dark:shadow-zinc-900/40">
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

            <ScrollArea className="mt-6 flex-1">
                <div className="space-y-4 pb-6">
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
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-full border border-transparent bg-zinc-900/5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-950 dark:bg-zinc-800/40 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                                        onClick={() => setPreviewSnippet(snippet)}
                                    >
                                        Preview
                                    </Button>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-700">
                                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                                        {new Date(snippet.updatedAt).toLocaleDateString()}
                                    </div>
                                    <Button
                                        size="sm"
                                        className="rounded-full bg-zinc-900 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-50 hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                                        onClick={() => handleInsert(snippet)}
                                    >
                                        Insert snippet
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
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {previewSnippet?.title}
                        </DialogTitle>
                        {previewSnippet?.summary && (
                            <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-400">
                                {previewSnippet.summary}
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
                            <Button onClick={() => handleInsert(previewSnippet)}>Insert snippet</Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
