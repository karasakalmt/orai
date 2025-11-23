import { useEffect, useState } from 'react';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { ogTestnet } from '../../lib/chains/0gChain';
import { switchToOGTestnet } from '../../lib/web3/addNetwork';

export function NetworkSwitcher() {
  const { chain } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    setIsCorrectNetwork(chainId === ogTestnet.id);
  }, [chainId]);

  const handleSwitch = async () => {
    // First try using wagmi's switchChain
    if (switchChain) {
      try {
        switchChain({ chainId: ogTestnet.id });
      } catch (error) {
        // If wagmi fails, use direct MetaMask method
        await switchToOGTestnet();
      }
    } else {
      // Fallback to direct MetaMask method
      await switchToOGTestnet();
    }
  };

  if (isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Connected to {ogTestnet.name}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
        ⚠️ Wrong Network
      </div>
      <button
        onClick={handleSwitch}
        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        Switch to {ogTestnet.name}
      </button>
    </div>
  );
}

// Standalone button to add network
export function AddNetworkButton() {
  const handleAddNetwork = async () => {
    await switchToOGTestnet();
  };

  return (
    <button
      onClick={handleAddNetwork}
      className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
    >
      Add 0G-Newton-Testnet to MetaMask
    </button>
  );
}