// gets: key for current script in localStorage
export const CURRENT_SCRIPT_KEY = "viem-playground-current-script";

// gets: key for current script ID in localStorage
export const CURRENT_SCRIPT_ID_KEY = "viem-playground-current-script-id";

const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

// gets: default script content
export const DEFAULT_SCRIPT_TEMPLATE = `import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const transport = http("https://eth.llamarpc.com");
const client = createPublicClient({
  chain: mainnet,
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
    if (scriptId === null) {
      localStorage.removeItem(CURRENT_SCRIPT_ID_KEY);
    } else {
      localStorage.setItem(CURRENT_SCRIPT_ID_KEY, scriptId.toString());
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
    const id = localStorage.getItem(CURRENT_SCRIPT_ID_KEY);
    return id ? Number.parseInt(id, 10) : null;
  } catch (error) {
    console.error("Failed to load current script ID:", error);
    return null;
  }
};
