import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../lib/contracts/config';

export function Ask() {
  const navigate = useNavigate();
  const { isConnected, address } = useWeb3();
  const [question, setQuestion] = useState('');
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Log any write errors
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      setSubmitStatus({
        type: 'error',
        message: writeError.message || 'Transaction failed. Please try again.'
      });
    }
  }, [writeError]);

  // Fixed fee (minimum is 0.01 0G from contract)
  const totalFee = 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      setSubmitStatus({ type: 'error', message: 'Please connect your wallet first' });
      return;
    }

    setSubmitStatus(null);

    try {
      console.log('Submitting question:', {
        question,
        fee: totalFee,
        contractAddress: CONTRACT_ADDRESSES.OracleContract
      });

      writeContract({
        address: CONTRACT_ADDRESSES.OracleContract as `0x${string}`,
        abi: CONTRACT_ABIS.OracleContract,
        functionName: 'queryOracle',
        args: [question, []],
        value: parseEther(totalFee.toString()),
      });
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Failed to submit question. Please try again.'
      });
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      // Navigate to Browse page with submission info
      navigate('/browse', {
        state: {
          submittedQuestion: question,
          transactionHash: hash,
          timestamp: Date.now()
        }
      });
    }
  }, [isSuccess, hash, question, navigate]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">🔗</div>
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 text-lg">
              Please connect your wallet to submit questions to the oracle
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Ask the Oracle
          </h1>
          <p className="text-xl text-gray-600">
            Submit your question and get AI-verified answers
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {/* Question Input */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Your Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={4}
                placeholder="What would you like to know?"
                minLength={10}
                maxLength={500}
                required
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">
                  Be specific and clear for better results
                </span>
                <span className={`text-sm ${question.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                  {question.length} / 500
                </span>
              </div>
            </div>

            {/* Fee Display */}
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Query Fee</h3>
                  <p className="text-sm text-gray-600 mt-1">Fixed fee per question</p>
                </div>
                <div className="text-3xl font-bold text-blue-600">{totalFee} 0G</div>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="mb-8 p-4 bg-gray-100 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connected Wallet</span>
                <span className="font-mono text-sm">{address?.slice(0, 8)}...{address?.slice(-6)}</span>
              </div>
            </div>

            {/* Status Message */}
            {submitStatus && (
              <div className={`mb-4 p-4 rounded-xl ${
                submitStatus.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                <p className="text-sm font-medium">{submitStatus.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!question || question.length < 10 || isPending || isConfirming}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isPending
                ? 'Waiting for approval...'
                : isConfirming
                ? 'Confirming transaction...'
                : 'Submit Question'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}