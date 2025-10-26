// gets: key for current script in localStorage
export const CURRENT_SCRIPT_KEY = "viem-playground-current-script";

// gets: key for current script ID in localStorage
const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

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

// gets: default script content
// @returns the default script content
export const getDefaultScriptContent = (): string => DEFAULT_SCRIPT_TEMPLATE;

// saves: current script content to localStorage
// @param code - the code to save
export const saveStoredScript = (code: string): void => {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(CURRENT_SCRIPT_KEY, code);
  } catch (error) {
    console.error("Failed to save current script:", error);
  }
};

// gets: current script content from localStorage
// @returns the current script content, or the default script content if not found
export const loadStoredScript = (): string => {
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

