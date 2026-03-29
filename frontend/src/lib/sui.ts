import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';

// Initialize Sui client for testnet
export const suiClient = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl('testnet'),
  network: 'testnet',
});

// Helper function to format address
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to get account balance in SUI
export const getAccountBalance = async (address: string): Promise<number> => {
  try {
    const balance = await suiClient.getBalance({ owner: address });
    return Number(balance.totalBalance) / 1_000_000_000; // Convert MIST to SUI
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
};
