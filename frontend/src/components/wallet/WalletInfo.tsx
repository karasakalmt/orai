import { useWeb3 } from '../../hooks/useWeb3';

interface WalletInfoProps {
  className?: string;
}

export function WalletInfo({ className = '' }: WalletInfoProps) {
  const {
    isConnected,
    shortAddress,
    formattedBalance,
    chainName,
    isCorrectNetwork,
  } = useWeb3();

  if (!isConnected) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg text-center ${className}`}>
        <p className="text-sm text-gray-600">No wallet connected</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Address */}
      <div className="flex items-center justify-between p-2 bg-white rounded border">
        <span className="text-xs text-gray-500">Address</span>
        <span className="text-xs font-mono">{shortAddress}</span>
      </div>

      {/* Balance */}
      {formattedBalance && (
        <div className="flex items-center justify-between p-2 bg-white rounded border">
          <span className="text-xs text-gray-500">Balance</span>
          <span className="text-xs font-mono">{formattedBalance}</span>
        </div>
      )}

      {/* Network */}
      <div className="flex items-center justify-between p-2 bg-white rounded border">
        <span className="text-xs text-gray-500">Network</span>
        <span
          className={`text-xs font-medium ${
            isCorrectNetwork ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {chainName}
        </span>
      </div>

      {/* Warning if wrong network */}
      {!isCorrectNetwork && (
        <div className="p-2 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-xs text-yellow-800">
            Please switch to 0G Network
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for header
export function CompactWalletInfo() {
  const { isConnected, shortAddress, chainName } = useWeb3();

  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">Connected to</span>
      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
        {shortAddress}
      </span>
      <span className="text-gray-500">on</span>
      <span className="font-medium">{chainName}</span>
    </div>
  );
}