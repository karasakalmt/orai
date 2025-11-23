import { useAccount, useDisconnect, useEnsName, useBalance } from 'wagmi';
import { formatEther } from 'viem';

export function useWeb3() {
  const { address, isConnected, isConnecting, isDisconnected, chain } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();

  // Format balance for display
  const formattedBalance = balance
    ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}`
    : undefined;

  // Get short address for display
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : undefined;

  // Check if on correct network (0G Testnet: 16602 or Mainnet: 16601)
  const isCorrectNetwork = chain?.id === 16602 || chain?.id === 16601;

  return {
    // Account info
    address,
    ensName,
    shortAddress,

    // Balance
    balance: balance?.value,
    formattedBalance,
    balanceSymbol: balance?.symbol,

    // Connection status
    isConnected,
    isConnecting,
    isDisconnected,

    // Network
    chain,
    chainId: chain?.id,
    chainName: chain?.name,
    isCorrectNetwork,

    // Actions
    disconnect,
  };
}

// Hook for checking if user has enough balance for a transaction
export function useHasSufficientBalance(requiredAmount: bigint) {
  const { balance } = useWeb3();

  if (!balance) return false;
  return balance >= requiredAmount;
}