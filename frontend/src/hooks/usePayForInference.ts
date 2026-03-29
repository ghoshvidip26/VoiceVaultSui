import { useState } from "react";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { useSuiWallet } from "./useSuiWallet";
import { CONTRACTS, suiToMist, calculatePaymentBreakdown } from "@/lib/contracts";
import { toast } from "sonner";

export interface PaymentOptions {
  creatorAddress: string;
  amount: number; // in SUI
  royaltyRecipient?: string;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

export function usePayForInference() {
  const { isConnected, address } = useSuiWallet();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [isPaying, setIsPaying] = useState(false);

  /**
   * Pay for voice inference using the on-chain payment contract.
   * Single transaction with royalty split via Move contract.
   */
  const payForInference = async (options: PaymentOptions) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return null;
    }

    const { creatorAddress, amount, royaltyRecipient, onSuccess, onError } = options;

    setIsPaying(true);

    try {
      const amountInMist = suiToMist(amount);
      const breakdown = calculatePaymentBreakdown(amountInMist);

      console.log("=== Payment Breakdown ===");
      console.log("Total amount:", amount, "SUI =", amountInMist, "MIST");
      console.log("Platform fee:", breakdown.platformFee, "MIST");
      console.log("Royalty:", breakdown.royaltyAmount, "MIST");
      console.log("Creator:", breakdown.creatorAmount, "MIST");

      toast.info("Payment Breakdown", {
        description: `Total: ${amount} SUI | Platform: ${(breakdown.platformFee / 1_000_000_000).toFixed(4)} SUI | Royalty: ${(breakdown.royaltyAmount / 1_000_000_000).toFixed(4)} SUI | Creator: ${(breakdown.creatorAmount / 1_000_000_000).toFixed(4)} SUI`,
        duration: 5000,
      });

      const tx = new Transaction();

      // Create a coin with the exact balance needed for payment
      const paymentCoin = coinWithBalance({ balance: BigInt(amountInMist) });

      // Call payment::pay_with_royalty_split with SUI coin type
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::${CONTRACTS.PAYMENT.module}::pay_with_royalty_split`,
        typeArguments: ["0x2::sui::SUI"],
        arguments: [
          paymentCoin,
          tx.pure.address(creatorAddress),
          tx.pure.address(CONTRACTS.PLATFORM_ADDRESS),
          tx.pure.address(royaltyRecipient || creatorAddress),
        ],
      });

      toast.info("Please approve the transaction in your wallet...");

      const result = await signAndExecute({
        transaction: tx,
      });

      const txDigest = result.digest;

      toast.info("Waiting for confirmation...");

      try {
        await suiClient.waitForTransaction({ digest: txDigest });
      } catch {
        // Transaction may still go through
      }

      toast.success("Payment successful!", {
        description: `Transaction: ${txDigest.slice(0, 8)}...${txDigest.slice(-6)}`,
      });

      if (onSuccess) {
        onSuccess(txDigest);
      }

      return {
        success: true,
        transactionHash: txDigest,
      };
    } catch (error: any) {
      console.error("Payment error:", error);
      const errorMessage = error.message || "Payment failed";

      toast.error("Payment failed", {
        description: errorMessage,
      });

      if (onError) {
        onError(error);
      }

      return null;
    } finally {
      setIsPaying(false);
    }
  };

  /**
   * Get payment breakdown for display before transaction
   */
  const getPaymentBreakdown = (amount: number) => {
    const amountInMist = suiToMist(amount);
    const breakdown = calculatePaymentBreakdown(amountInMist);

    return {
      total: amount,
      platformFee: breakdown.platformFee / 1_000_000_000,
      royalty: breakdown.royaltyAmount / 1_000_000_000,
      creator: breakdown.creatorAmount / 1_000_000_000,
    };
  };

  return {
    payForInference,
    getPaymentBreakdown,
    isPaying,
  };
}
