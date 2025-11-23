/**
 * 0G-Newton-Testnet RPC Endpoints
 * Multiple endpoints for redundancy and fallback
 */

export const OG_TESTNET_RPC_ENDPOINTS = {
  primary: 'https://evmrpc-testnet.0g.ai',

  // Alternative HTTP endpoints
  alternatives: [
    'https://0g-json-rpc-public.originstake.com',
    'https://0g-newton-testnet.drpc.org',
    'https://0g-evm-rpc.murphynode.net',
    'https://rpc.ankr.com/0g_newton',
    'https://0g-testnet-evm.itrocket.net',
    'https://0g-testnet-jsonrpc.blockhub.id',
  ],

  // WebSocket endpoints
  websocket: [
    'wss://0g-newton-testnet.drpc.org',
  ],

  // Block explorer
  explorer: 'https://explorer-testnet.0g.ai',
};

/**
 * Network configuration details
 */
export const NETWORK_CONFIG = {
  name: '0G-Newton-Testnet',
  chainId: 16600, // 0x40d8 in hex
  currency: {
    name: 'A0GI',
    symbol: 'A0GI',
    decimals: 18,
  },
  blockGasLimit: 36000000,
};

/**
 * Helper function to test RPC endpoint connectivity
 */
export async function testRpcEndpoint(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    return !!data.result;
  } catch {
    return false;
  }
}

/**
 * Get the best available RPC endpoint
 */
export async function getBestRpcEndpoint(): Promise<string> {
  // Try primary first
  if (await testRpcEndpoint(OG_TESTNET_RPC_ENDPOINTS.primary)) {
    return OG_TESTNET_RPC_ENDPOINTS.primary;
  }

  // Try alternatives
  for (const endpoint of OG_TESTNET_RPC_ENDPOINTS.alternatives) {
    if (await testRpcEndpoint(endpoint)) {
      console.log(`Using fallback RPC: ${endpoint}`);
      return endpoint;
    }
  }

  // Default to primary if all fail
  console.warn('All RPC endpoints failed, using primary as fallback');
  return OG_TESTNET_RPC_ENDPOINTS.primary;
}