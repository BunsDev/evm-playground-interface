/** Ambient typings for the in-editor virtual viem client module. */
declare module "viem-playground-client" {
  import type { createPublicClient } from "viem";
  import type { Chain } from "viem/chains";

  type PublicClient = ReturnType<typeof createPublicClient>;
  type PublicClientConfig = Parameters<typeof createPublicClient>[0];

  export const rpcUrl: string;
  export const defaultChain: Chain;
  export const chain: Chain;
  export const transport: PublicClientConfig["transport"];
  export const publicClient: PublicClient;

  export const getRpcUrl: () => string;
  export const getChain: () => Chain;
  export const getTransport: () => PublicClientConfig["transport"];
  export const getPublicClient: () => PublicClient;

  export const configurePublicClient: (
    options?: Partial<PublicClientConfig> & { rpcUrl?: string }
  ) => PublicClient;

  export const resetPublicClient: () => PublicClient;
}
