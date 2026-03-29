// Contract addresses and module names for deployed Sui Move contracts

export const CONTRACTS = {
  // Published package ID on Sui testnet (from Published.toml)
  PACKAGE_ID: "0x1ad12f0fd581dbd4fef7a30c9cff9bececfca1da450fe53257791502b3db073d",
  
  // VoiceRegistry shared object ID (created by init_registry)
  // Update this after calling: sui client call --function init_registry --package {PACKAGE_ID}
  // For now, using a placeholder - it will be initialized on first app load
  VOICE_REGISTRY_ID: import.meta.env.VITE_SUI_VOICE_REGISTRY_ID || "0x",
  
  VOICE_IDENTITY: {
    module: "voice_identity",
  },
  PAYMENT: {
    module: "payment",
  },
  
  // Platform fee recipient address - your wallet address
  PLATFORM_ADDRESS: "0x00fe9f516cc03adabcb1c521ecb82f9d2c5c9a42102b5e9895939b63d098df70",
} as const;

// Fee structure (matching Move contract)
export const FEE_STRUCTURE = {
  PLATFORM_FEE_BPS: 250, // 2.5%
  ROYALTY_BPS: 1000, // 10%
} as const;

// Helper to calculate payment breakdown
export function calculatePaymentBreakdown(totalAmount: number) {
  const platformFee = Math.floor((totalAmount * FEE_STRUCTURE.PLATFORM_FEE_BPS) / 10_000);
  const remainingAfterPlatform = totalAmount - platformFee;
  const royaltyAmount = Math.floor((remainingAfterPlatform * FEE_STRUCTURE.ROYALTY_BPS) / 10_000);
  const creatorAmount = remainingAfterPlatform - royaltyAmount;

  return {
    totalAmount,
    platformFee,
    royaltyAmount,
    creatorAmount,
  };
}

// Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
export function suiToMist(sui: number): number {
  return Math.floor(sui * 1_000_000_000);
}

// Convert MIST to SUI
export function mistToSui(mist: number): number {
  return mist / 1_000_000_000;
}
