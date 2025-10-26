import type { Abi } from "viem";
import Dexie, { type Table, type Transaction } from "dexie";

export interface StoredChain {
  id?: number;
  slug: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl?: string;
  nativeCurrencySymbol: string;
  nativeCurrencyName: string;
  nativeCurrencyDecimals: number;
  testnet: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredABI {
  id?: number;
  slug: string;
  name: string;
  abi: Abi;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredContract {
  id?: number;
  slug: string;
  name: string;
  abiSlug: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractAddressMapping {
  id?: number;
  contractSlug: string;
  chainSlug: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SnippetCategory = "setup" | "read" | "write" | "events" | "utility";

export interface CodeSnippet {
  id?: number;
  slug: string;
  title: string;
  category: SnippetCategory;
  summary?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

type Seed<T> = Omit<T, "createdAt" | "updatedAt">;

const timestamp = () => new Date();

const ERC20_MINIMAL_ABI: Abi = [
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
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
];

const CHAIN_SEEDS: Seed<StoredChain>[] = [
  {
    slug: "ethereum-mainnet",
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    nativeCurrencySymbol: "ETH",
    nativeCurrencyName: "Ether",
    nativeCurrencyDecimals: 18,
    testnet: false,
  },
  {
    slug: "ethereum-sepolia",
    name: "Ethereum Sepolia",
    chainId: 11155111,
    rpcUrl: "https://1rpc.io/sepolia",
    explorerUrl: "https://sepolia.etherscan.io",
    nativeCurrencySymbol: "ETH",
    nativeCurrencyName: "Sepolia Ether",
    nativeCurrencyDecimals: 18,
    testnet: true,
  },
];

const ABI_SEEDS: Seed<StoredABI>[] = [
  {
    slug: "erc20-minimal",
    name: "ERC-20 Minimal",
    description: "Subset of ERC-20 functions commonly needed for prototyping.",
    abi: ERC20_MINIMAL_ABI,
  },
];

const CONTRACT_SEEDS: Seed<StoredContract>[] = [
  {
    slug: "sample-erc20",
    name: "Sample ERC-20 Token",
    abiSlug: "erc20-minimal",
    summary: "Reference ERC-20 instance used by default snippets and scripts.",
  },
];

const CONTRACT_ADDRESS_SEEDS: Seed<ContractAddressMapping>[] = [
  {
    contractSlug: "sample-erc20",
    chainSlug: "ethereum-mainnet",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  {
    contractSlug: "sample-erc20",
    chainSlug: "ethereum-sepolia",
    address: "0x7B3Ce8d3Be32690c1F9Ff8A5952d3F77D2C77b04",
  },
];

const SNIPPET_SEEDS: Seed<CodeSnippet>[] = [
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
  },
  {
    id: 2,
    slug: "setup-public-client",
    title: "Create a viem public client",
    category: "setup",
    summary: "Bootstrap a viem public client pointed at Ethereum mainnet.",
    content: `import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export const client = createPublicClient({
  chain: mainnet,
  transport: http("https://eth.llamarpc.com"),
});
`,
  },
  {
    id: 3,
    slug: "erc20-read-balance",
    title: "Read ERC-20 balance",
    category: "read",
    summary: "Calls balanceOf using the minimal ERC-20 ABI.",
    content: `import { client } from "./setup-public-client";
import { erc20Minimal } from "./erc20-abi-definition";

export async function readBalance(holder) {
  const balance = await client.readContract({
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    abi: erc20Minimal,
    functionName: "balanceOf",
    args: [holder],
  });

  console.log("Balance:", balance);
}
`,
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

export async function transfer(to, amount) {
  const txHash = await walletClient.writeContract({
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    abi: erc20Minimal,
    functionName: "transfer",
    args: [to, amount],
  });

  console.log("Submitted tx:", txHash);
}
`,
  },
];

class PlaygroundDatabase extends Dexie {
  chains!: Table<StoredChain, number>;
  contracts!: Table<StoredContract, number>;
  abis!: Table<StoredABI, number>;
  snippets!: Table<CodeSnippet, number>;
  contractAddresses!: Table<ContractAddressMapping, number>;

  constructor() {
    super("EvmPlaygroundDatabase");

    this.version(2).stores({
      chains: "++id, slug, chainId, name",
      contracts: "++id, slug, abiSlug, name",
      abis: "++id, slug, name",
      snippets: "++id, slug, category",
      contractAddresses: "++id, chainSlug, contractSlug",
    }).upgrade(async (transaction) => {
      await this.seedDefaults(transaction);
    });

    this.on("populate", async () => {
      await this.seedDefaults();
    });
  }

  private async seedDefaults(transaction?: Transaction) {
    const created = timestamp();

    const decorate = <T>(seed: Seed<T>): T => ({ ...seed, createdAt: created, updatedAt: created }) as T;

    const run = async () => {
      await this.chains.bulkAdd(CHAIN_SEEDS.map(decorate));
      await this.abis.bulkAdd(ABI_SEEDS.map(decorate));
      await this.contracts.bulkAdd(CONTRACT_SEEDS.map(decorate));
      await this.contractAddresses.bulkAdd(CONTRACT_ADDRESS_SEEDS.map(decorate));
      await this.snippets.bulkAdd(SNIPPET_SEEDS.map(decorate));
    };

    if (transaction) {
      await run();
    } else {
      await this.transaction(
        "rw",
        [this.chains, this.contracts, this.abis, this.contractAddresses, this.snippets],
        run,
      );
    }
  }
}

export const playgroundDb = new PlaygroundDatabase();

export const chainsTable = playgroundDb.chains;
export const contractsTable = playgroundDb.contracts;
export const snippetsTable = playgroundDb.snippets;
export const contractAddressesTable = playgroundDb.contractAddresses;

export const abiDb = playgroundDb;
