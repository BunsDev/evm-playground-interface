// gets: key for current script in localStorage
export const CURRENT_SCRIPT_KEY = "viem-playground-current-script";

// gets: key for current script ID in localStorage
export const CURRENT_SCRIPT_ID_KEY = "viem-playground-current-script-id";

interface ScriptStorage {
  CURRENT_SCRIPT_ID_KEY: string;
}

const getScriptIdStorageKey = (
  scriptStorage: ScriptStorage = { CURRENT_SCRIPT_ID_KEY },
): string => {
  if (!isBrowser()) {
    return scriptStorage.CURRENT_SCRIPT_ID_KEY;
  }

  try {
    const scope = window.location.pathname || "/";
    return `${scriptStorage.CURRENT_SCRIPT_ID_KEY}:${scope}`;
  } catch (_) {
    return scriptStorage.CURRENT_SCRIPT_ID_KEY;
  }
};

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

// saves: current script ID to localStorage
// @param scriptId - the ID of the script to save
export const saveStoredScriptId = (scriptId: number | null): void => {
  if (!isBrowser()) return;
  try {
    const scopedKey = getScriptIdStorageKey();
    if (scriptId === null) {
      localStorage.removeItem(scopedKey);
      localStorage.removeItem(CURRENT_SCRIPT_ID_KEY);
    } else {
      localStorage.setItem(scopedKey, scriptId.toString());
      if (scopedKey !== CURRENT_SCRIPT_ID_KEY) {
        localStorage.removeItem(CURRENT_SCRIPT_ID_KEY);
      }
    }
  } catch (error) {
    console.error("Failed to save current script ID:", error);
  }
};

// gets: current script ID from localStorage
// @returns the ID of the current script, or null if not found
export const loadStoredScriptId = (): number | null => {
  if (!isBrowser()) {
    return null;
  }
  try {
    const scopedKey = getScriptIdStorageKey();
    const id = localStorage.getItem(scopedKey);
    if (id) {
      return Number.parseInt(id, 10);
    }

    const legacyId = localStorage.getItem(CURRENT_SCRIPT_ID_KEY);
    if (!legacyId) {
      return null;
    }

    localStorage.removeItem(CURRENT_SCRIPT_ID_KEY);
    localStorage.setItem(scopedKey, legacyId);
    return Number.parseInt(legacyId, 10);
  } catch (error) {
    console.error("Failed to load current script ID:", error);
    return null;
  }
};
