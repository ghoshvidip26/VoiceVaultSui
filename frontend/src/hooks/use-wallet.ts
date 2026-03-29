import { useCurrentAccount } from "@mysten/dapp-kit";

/**
 * Thin wrapper to keep the existing `useWallet` API shape,
 * now using Sui dApp Kit.
 */
export function useWallet() {
  const account = useCurrentAccount();

  return {
    connected: !!account?.address,
    account,
  };
}
