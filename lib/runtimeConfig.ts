const RPC_URL_KEY = "viem-playground-rpc-url";

export const DEFAULT_RPC_URL =
  process.env.NEXT_PUBLIC_DEFAULT_RPC_URL ?? "https://eth.llamarpc.com";

const isBrowser = (): boolean =>
    typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const loadRpcUrl = (): string => {
    if (!isBrowser()) return DEFAULT_RPC_URL;

    try {
        const stored = window.localStorage.getItem(RPC_URL_KEY);
        return stored && stored.trim().length > 0 ? stored : DEFAULT_RPC_URL;
    } catch (error) {
        console.error("Failed to load RPC URL from storage:", error);
        return DEFAULT_RPC_URL;
    }
};

export const saveRpcUrl = (rpcUrl: string): void => {
    if (!isBrowser()) return;

    try {
        if (rpcUrl.trim().length === 0) {
            window.localStorage.removeItem(RPC_URL_KEY);
            return;
        }
        window.localStorage.setItem(RPC_URL_KEY, rpcUrl);
    } catch (error) {
        console.error("Failed to save RPC URL to storage:", error);
    }
};
