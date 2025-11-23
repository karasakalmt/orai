import { ogTestnet } from '../chains/0gChain';

/**
 * Add 0G Testnet to MetaMask
 */
export async function addOGTestnetToMetaMask() {
  if (!window.ethereum) {
    alert('Please install MetaMask to use this application');
    return false;
  }

  try {
    // Request to add the network
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${ogTestnet.id.toString(16)}`, // 0x40da
          chainName: ogTestnet.name,
          nativeCurrency: ogTestnet.nativeCurrency,
          rpcUrls: [ogTestnet.rpcUrls.default.http[0]],
          blockExplorerUrls: [ogTestnet.blockExplorers?.default?.url],
        },
      ],
    });

    console.log('0G Testnet added successfully');
    return true;
  } catch (error: any) {
    // User rejected the request or error occurred
    if (error.code === 4001) {
      console.log('User rejected adding network');
    } else {
      console.error('Error adding network:', error);
    }
    return false;
  }
}

/**
 * Switch to 0G Testnet
 */
export async function switchToOGTestnet() {
  if (!window.ethereum) {
    alert('Please install MetaMask to use this application');
    return false;
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${ogTestnet.id.toString(16)}` }], // 0x40da (16602)
    });

    console.log('Switched to 0G Testnet');
    return true;
  } catch (error: any) {
    // Network not added yet, add it
    if (error.code === 4902) {
      console.log('Network not found, adding...');
      return await addOGTestnetToMetaMask();
    } else if (error.code === 4001) {
      console.log('User rejected switching network');
    } else {
      console.error('Error switching network:', error);
    }
    return false;
  }
}

/**
 * Check if connected to correct network
 */
export async function checkNetwork(): Promise<boolean> {
  if (!window.ethereum) return false;

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });

    const currentChainId = parseInt(chainId, 16);
    return currentChainId === ogTestnet.id;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
}

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}