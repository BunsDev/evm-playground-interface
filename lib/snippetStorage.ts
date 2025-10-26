import { abiDb } from "./abiDatabase";
import type { CodeSnippet } from "./abiDatabase";

// gets: key for current script in localStorage
export const CURRENT_SCRIPT_KEY = "viem-playground-current-script";

const SNIPPET_LIBRARY_VERSION = "2025-10-26-core-refresh-2";
const SNIPPET_LIBRARY_VERSION_KEY = "viem-playground-snippet-library-version";

const LEGACY_FALLBACK_SLUGS = [
  "erc20-abi-definition",
  "setup-public-client",
  "erc20-read-balance",
  "erc20-transfer",
];

// gets: key for current script ID in localStorage
const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const snippet = (lines: string[]): string => lines.join("\n");

const DEFAULT_SNIPPET_TIMESTAMP_ISO = "2025-10-26T00:00:00.000Z";

const CORE_SNIPPET_DEFAULTS: CodeSnippet[] = [
  {
    slug: "account-get-defaults",
    title: "Fetch account defaults",
    category: "account",
    summary: "Retrieve balance, code, transaction count, and storage root for an address.",
    content: snippet([
      'import { createPublicClient, http } from "viem";',
      'import { mainnet } from "viem/chains";',
      "",
      "const client = createPublicClient({",
      "  chain: mainnet,",
      '  transport: http("https://eth.llamarpc.com"),',
      "}) as any;",
      "",
      "export async function getAccountDefaults(address: string) {",
      "  try {",
      "    const [balance, transactionCount, code, proof] = await Promise.all([",
      "      client.getBalance({ address }),",
      "      client.getTransactionCount({ address }),",
      "      client.getCode({ address }),",
      '      client.getProof({ address, storageKeys: ["0x0"] }),',
      "    ]);",
      "",
      "    const result = {",
      "      balance,",
      "      transactionCount,",
      "      code,",
      "      storageRoot: proof.storageHash,",
      "      deployedContracts: [],",
      "    };",
      "",
      '    console.log("Account defaults", result);',
      "",
      "    return result;",
      "  } catch (error) {",
      '    console.error("Failed to load account defaults:", error);',
      "    throw error;",
      "  }",
      "}",
    ]),
    createdAt: new Date(DEFAULT_SNIPPET_TIMESTAMP_ISO),
    updatedAt: new Date(DEFAULT_SNIPPET_TIMESTAMP_ISO),
  },
  {
    slug: "blocks-get-defaults",
    title: "Inspect latest block",
    category: "blocks",
    summary: "Fetch a block with transaction and state roots alongside fee data.",
    content: snippet([
      'import { createPublicClient, http } from "viem";',
      'import { mainnet } from "viem/chains";',
      "",
      "const client = createPublicClient({",
      "  chain: mainnet,",
      '  transport: http("https://eth.llamarpc.com"),',
      "}) as any;",
      "",
      "export async function getLatestBlock() {",
      "  try {",
      '    const block = await client.getBlock({ blockTag: "latest" });',
      "",
      "    const summary = {",
      "      number: block.number,",
      "      hash: block.hash,",
      "      parentHash: block.parentHash,",
      "      timestamp: block.timestamp,",
      "      gasLimit: block.gasLimit,",
      "      gasUsed: block.gasUsed,",
      "      baseFeePerGas: block.baseFeePerGas,",
      "      transactionsRoot: block.transactionsRoot,",
      "      stateRoot: block.stateRoot,",
      "      receiptsRoot: block.receiptsRoot,",
      "    };",
      "",
      '    console.log("Latest block summary", summary);',
      "",
      "    return summary;",
      "  } catch (error) {",
      '    console.error("Failed to load latest block:", error);',
      "    throw error;",
      "  }",
      "}",
    ]),
    createdAt: new Date(DEFAULT_SNIPPET_TIMESTAMP_ISO),
    updatedAt: new Date(DEFAULT_SNIPPET_TIMESTAMP_ISO),
  },
  {
    slug: "contracts-get-defaults",
    title: "Summarize contract metadata",
    category: "contracts",
    summary: "Read code, ABI from your registry, and transaction count for a contract address.",
    content: snippet([
      'import { createPublicClient, http, keccak256 } from "viem";',
      'import { mainnet } from "viem/chains";',
      "",
      "const client = createPublicClient({",
      "  chain: mainnet,",
      '  transport: http("https://eth.llamarpc.com"),',
      "}) as any;",
      "",
      "export async function getContractDefaults(address: string) {",
      "  try {",
      "    const [code, transactionCount] = await Promise.all([",
      "      client.getCode({ address }),",
      "      client.getTransactionCount({ address }),",
      "    ]);",
      "",
      "    const result = {",
      "      code,",
      "      transactionCount,",
      "      abi: [], // Supply your ABI from local registry or remote source",
      "      deployedBytecodeHash: code ? keccak256(code) : null,",
      "    };",
      "",
      '    console.log("Contract defaults", result);',
      "",
      "    return result;",
      "  } catch (error) {",
      '    console.error("Failed to load contract defaults:", error);',
      "    throw error;",
      "  }",
      "}",
    ]),
    createdAt: new Date(DEFAULT_SNIPPET_TIMESTAMP_ISO),
    updatedAt: new Date(DEFAULT_SNIPPET_TIMESTAMP_ISO),
  },
  {
    slug: "gas-estimate-defaults",
    title: "Estimate gas with fee data",
    category: "gas",
    summary: "Produce max fee, priority fee, and gas limits for a contract call.",
    content: snippet([
      'import { createPublicClient, http } from "viem";',
      'import { mainnet } from "viem/chains";',
      "",
      "const client = createPublicClient({",
      "  chain: mainnet,",
      '  transport: http("https://eth.llamarpc.com"),',
      "}) as any;",
      "",
      "export async function estimateGasWithFees(request: {",
      "  account: string;",
      "  to: string;",
      "  data: `0x<hex-string>`;",
      "}) {",
      "  try {",
      "    const [gas, gasPrice, feeHistory] = await Promise.all([",
      "      client.estimateGas(request),",
      "      client.getGasPrice(),",
      "      client.getFeeHistory({ blockCount: 1n, rewardPercentiles: [10, 50, 90] }),",
      "    ]);",
      "",
      "    const baseFeePerGas = feeHistory.baseFeePerGas?.[0] ?? null;",
      "    const maxPriorityFeePerGas = feeHistory.reward?.[0]?.[1] ?? null;",
      "",
      "    const result = {",
      "      gas,",
      "      gasPrice,",
      "      baseFeePerGas,",
      "      maxFeePerGas:",
      "        baseFeePerGas !== null && maxPriorityFeePerGas !== null",
      "          ? baseFeePerGas + maxPriorityFeePerGas",
      "          : null,",
      "      maxPriorityFeePerGas,",
      "    };",
      "",
      '    console.log("Gas estimate defaults", result);',
      "",
      "    return result;",
      "  } catch (error) {",
      '    console.error("Failed to load gas estimate defaults:", error);',
      "    throw error;",
      "  }",
      "}",
    ]),
    createdAt: new Date(DEFAULT_SNIPPET_TIMESTAMP_ISO),
    updatedAt: new Date(DEFAULT_SNIPPET_TIMESTAMP_ISO),
  },
  {
    slug: "transactions-get-defaults",
    title: "Decode transaction defaults",
    category: "transactions",
    summary: "Pull a transaction by hash and map core fields for diagnostics.",
    content: snippet([
      'import { createPublicClient, http } from "viem";',
      'import { mainnet } from "viem/chains";',
      "",
      "const client = createPublicClient({",
      "  chain: mainnet,",
      '  transport: http("https://eth.llamarpc.com"),',
      "}) as any;",
      "",
      "export async function getTransactionDefaults(hash: `0x<tx-hash>`) {",
      "  try {",
      "    const tx = await client.getTransaction({ hash });",
      "",
      "    if (!tx) return null;",
      "",
      "    const result = {",
      "      hash: tx.hash,",
      "      from: tx.from,",
      "      to: tx.to,",
      "      value: tx.value,",
      "      gas: tx.gas,",
      "      gasPrice: tx.gasPrice,",
      "      nonce: tx.nonce,",
      "      blockNumber: tx.blockNumber,",
      "      blockHash: tx.blockHash,",
      "      transactionIndex: tx.transactionIndex,",
      "      type: tx.type,",
      "      chainId: tx.chainId,",
      "      input: tx.input,",
      "      v: tx.v,",
      "      r: tx.r,",
      "      s: tx.s,",
      "      maxFeePerGas: tx.maxFeePerGas,",
      "      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,",
      "    };",
      "",
      '    console.log("Transaction defaults", result);',
      "",
      "    return result;",
      "  } catch (error) {",
      '    console.error("Failed to load transaction defaults:", error);',
      "    throw error;",
      "  }",
      "}",
    ]),
    createdAt: new Date(DEFAULT_SNIPPET_TIMESTAMP_ISO),
    updatedAt: new Date(DEFAULT_SNIPPET_TIMESTAMP_ISO),
  },
];

const cloneSnippet = (snippet: CodeSnippet): CodeSnippet => ({
  ...snippet,
  createdAt: new Date(snippet.createdAt),
  updatedAt: new Date(snippet.updatedAt),
});

export const getCoreSnippetDefaults = (): CodeSnippet[] =>
  CORE_SNIPPET_DEFAULTS.map(cloneSnippet);

export const ensureLatestSnippetDefaults = async (): Promise<void> => {
  if (!isBrowser()) return;

  const storedVersion = window.localStorage.getItem(SNIPPET_LIBRARY_VERSION_KEY);
  if (storedVersion === SNIPPET_LIBRARY_VERSION) {
    return;
  }

  const snippets = getCoreSnippetDefaults();

  await abiDb.transaction("rw", abiDb.snippets, async () => {
    for (const snippetEntry of snippets) {
      const existing = await abiDb.snippets.where("slug").equals(snippetEntry.slug).first();
      if (existing?.id !== undefined) {
        await abiDb.snippets.update(existing.id, {
          ...snippetEntry,
          id: existing.id,
          createdAt: existing.createdAt ?? snippetEntry.createdAt,
        });
      } else {
        await abiDb.snippets.add(snippetEntry);
      }
    }

    await abiDb.snippets.where("slug").anyOf(LEGACY_FALLBACK_SLUGS).delete();
  });

  window.localStorage.setItem(SNIPPET_LIBRARY_VERSION_KEY, SNIPPET_LIBRARY_VERSION);
};

export const clearSnippetCache = async (): Promise<void> => {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(CURRENT_SCRIPT_KEY);
      window.localStorage.removeItem(SNIPPET_LIBRARY_VERSION_KEY);
    } catch (error) {
      console.error("Failed to clear snippet cache keys:", error);
    }
  }

  try {
    await abiDb.snippets.clear();
  } catch (error) {
    console.error("Failed to clear snippet Dexie table:", error);
  }
};

// gets: default script content
export const DEFAULT_SCRIPT_TEMPLATE = `import { createPublicClient, defineChain, http } from 'viem';

const rpcUrl = "https://eth.llamarpc.com";

const chain = defineChain({
  id: 1,
  name: "Ethereum Mainnet",
  network: "mainnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [rpcUrl] },
    public: { http: [rpcUrl] },
  },
});

const transport = http(rpcUrl);
const client = createPublicClient({
  chain,
  transport,
});

try {
  const blockNumber = await client.getBlockNumber();
  const chainId = await client.getChainId();
  const gasPrice = await client.getGasPrice();

  console.log('Latest block:', blockNumber);
  console.log('Chain ID:', chainId);
  console.log('Gas Price:', gasPrice);
} catch (error) {
  console.error('Failed to fetch data from the chain:', error);
}
`;

// gets: default snippet content
// @returns the default snippet content
export const getDefaultSnippetContent = (): string => DEFAULT_SCRIPT_TEMPLATE;

// saves: current snippet content to localStorage
// @param code - the code to save
export const saveStoredSnippet = (code: string): void => {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(CURRENT_SCRIPT_KEY, code);
  } catch (error) {
    console.error("Failed to save current snippet:", error);
  }
};

// gets: current snippet content from localStorage
// @returns the current snippet content, or the default snippet content if not found
export const loadStoredSnippet = (): string => {
  if (!isBrowser()) {
    return DEFAULT_SCRIPT_TEMPLATE;
  }
  try {
    return localStorage.getItem(CURRENT_SCRIPT_KEY) || DEFAULT_SCRIPT_TEMPLATE;
  } catch (error) {
    console.error("Failed to load current script:", error);
    return DEFAULT_SCRIPT_TEMPLATE;
  }
};

