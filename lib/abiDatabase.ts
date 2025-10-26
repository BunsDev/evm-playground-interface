import Dexie from "dexie";

export interface StoredABI {
  id?: number;
  name: string; // e.g., "RitualWalletABI"
  abi: any[]; // Raw ABI JSON array
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ABIDatabase extends Dexie {
  abis!: Dexie.Table<StoredABI, number>;

  constructor() {
    super("ABIDatabase");
    this.version(1).stores({
      abis: "++id, name, createdAt, updatedAt",
    });
  }
}

export interface StoredScript {
  id?: number;
  name: string;
  content: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ScriptDatabase extends Dexie {
  scripts!: Dexie.Table<StoredScript, number>;

  constructor() {
    super("ScriptDatabase");
    this.version(1).stores({
      scripts: "++id, name, createdAt, updatedAt",
    });
    this.on("populate", async () => {
      const now = new Date();
      await this.scripts.bulkAdd([
        {
          name: "Mainnet Stats",
          description: "Fetch latest block, chain id, and gas price",
          content: `import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://eth.llamarpc.com"),
});

export async function run() {
  const [blockNumber, chainId, gasPrice] = await Promise.all([
    client.getBlockNumber(),
    client.getChainId(),
    client.getGasPrice(),
  ]);

  console.log("Latest block:", blockNumber);
  console.log("Chain ID:", chainId);
  console.log("Gas price:", gasPrice);
}

await run();
`,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: "Block Inspector",
          description: "Inspect transactions in a recent block",
          content: `import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://eth.llamarpc.com"),
});

export async function run() {
  const latest = await client.getBlockNumber();
  const block = await client.getBlock({ blockNumber: latest });

  console.log("Block", latest.toString());
  console.log("Hash", block.hash);
  console.log("Transaction count", block.transactions.length);
}

await run();
`,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    });
  }
}

export const abiDb = new ABIDatabase();
export const scriptDb = new ScriptDatabase();
