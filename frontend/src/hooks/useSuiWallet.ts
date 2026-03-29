import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useMemo } from "react";

/**
 * Enhanced wallet hook with Sui utilities
 */
export function useSuiWallet() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  const isConnected = useMemo(() => {
    return !!account?.address;
  }, [account]);

  const address = useMemo(() => {
    return account?.address || null;
  }, [account]);

  return {
    isConnected,
    address,
    account,
    suiClient,
  };
}

/**
 * Get account balance in SUI
 */
export async function getAccountBalance(suiClient: any, address: string): Promise<number> {
  try {
    const balance = await suiClient.getBalance({ owner: address });
    return Number(balance.totalBalance) / 1_000_000_000; // Convert MIST to SUI
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
}
