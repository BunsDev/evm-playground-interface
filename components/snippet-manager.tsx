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
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Snippets</h3>
                <p className="text-sm text-muted-foreground">
                    Quick-start code blocks sourced from the playground library.
                </p>
                {loadError && (
                    <p className="mt-2 text-xs text-amber-600">{loadError}</p>
                )}
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {snippets.map((snippet) => (
                        <div
                            key={snippet.slug}
                            className="border rounded-lg p-3 bg-white shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                                            {snippet.title}
                                        </h4>
                                        <Badge variant="secondary" className="uppercase text-[10px]">
                                            {snippet.category}
                                        </Badge>
                                    </div>
                                    {snippet.summary && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {snippet.summary}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setPreviewSnippet(snippet)}
                                    >
                                        Preview
                                    </Button>
                                    <Button size="sm" onClick={() => handleInsert(snippet)}>
                                        Insert
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {snippets.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-8">
                            No snippets available yet.
                        </div>
                    )}
                </div>
            </ScrollArea>

            <Dialog open={Boolean(previewSnippet)} onOpenChange={() => setPreviewSnippet(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{previewSnippet?.title}</DialogTitle>
                        {previewSnippet?.summary && (
                            <DialogDescription>{previewSnippet.summary}</DialogDescription>
                        )}
                    </DialogHeader>
                    <pre className="mt-4 bg-muted rounded-md p-4 text-xs overflow-x-auto">
                        <code>{previewSnippet?.content}</code>
                    </pre>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setPreviewSnippet(null)}
                        >
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
