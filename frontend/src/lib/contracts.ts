// Contract addresses and module names for deployed Sui Move contracts
export const CONTRACTS = {
  // Published package ID on Sui testnet
  PACKAGE_ID: "0xfad2808bcd104197b53b1fddede5f25d5c16303b147d280c2aa7ff69d27e5d59",
  // VoiceRegistry shared object ID (created by init_registry)
  // TODO: Replace with actual object ID after calling init_registry on testnet
  VOICE_REGISTRY_ID: "0x0000000000000000000000000000000000000000000000000000000000000000",
  VOICE_IDENTITY: {
    module: "voice_identity",
  },
  PAYMENT: {
    module: "payment",
  },
  // Platform fee recipient address
  PLATFORM_ADDRESS: "0xfad2808bcd104197b53b1fddede5f25d5c16303b147d280c2aa7ff69d27e5d59",
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
