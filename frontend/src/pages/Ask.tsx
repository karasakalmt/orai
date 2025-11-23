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

  // Dynamic fee calculation: 0.07 base + 0.02 per 10 characters
  const calculateFee = (text: string) => {
    const baseFee = 0.07;
    const additionalFee = Math.floor(text.length / 10) * 0.02;
    return baseFee + additionalFee;
  };

  const totalFee = calculateFee(question);

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
        args: [question, ["null"]],
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
      // Save to localStorage
      const savedQuestions = JSON.parse(localStorage.getItem('orai_questions') || '[]');
      const newQuestion = {
        transactionHash: hash,
        question,
        timestamp: Date.now(),
        fee: totalFee,
        status: 'pending'
      };
      savedQuestions.push(newQuestion);
      localStorage.setItem('orai_questions', JSON.stringify(savedQuestions));

      // Navigate to Browse page with submission info
      navigate('/browse', {
        state: {
          submittedQuestion: question,
          transactionHash: hash,
          timestamp: Date.now()
        }
      });
    }
  }, [isSuccess, hash, question, navigate, totalFee]);

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
                  <p className="text-sm text-gray-600 mt-1">
                    0.07 0G base + 0.02 0G per 10 characters
                  </p>
                </div>
                <div className="text-3xl font-bold text-blue-600">{totalFee.toFixed(2)} 0G</div>
              </div>
              {question.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Base fee</span>
                    <span>0.07 0G</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Length fee ({Math.floor(question.length / 10)} × 0.02)</span>
                    <span>{(Math.floor(question.length / 10) * 0.02).toFixed(2)} 0G</span>
                  </div>
                </div>
              )}
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

        {/* Integration Documentation */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Integrate Orai Oracle in Your Smart Contract
          </h2>
          <p className="text-gray-600 mb-6">
            Use Orai Oracle to add AI-verified knowledge to your decentralized applications.
            Here's how to integrate it into your own Solidity contracts:
          </p>

          {/* Step 1 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Step 1: Define the Oracle Interface
            </h3>
            <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
              <pre className="text-sm text-gray-100 font-mono">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOraiOracle {
    function queryOracle(
        string memory question,
        string[] memory referenceUrls
    ) external payable returns (bytes32 questionId);

    function getAnswer(bytes32 questionId)
        external view returns (string memory answer, bool verified);
}`}
              </pre>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Step 2: Implement Your Contract
            </h3>
            <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
              <pre className="text-sm text-gray-100 font-mono">
{`contract MyDApp {
    IOraiOracle public oracle;
    uint256 public constant ORACLE_FEE = 0.01 ether; // 0.01 0G

    mapping(bytes32 => address) public questionAskers;

    constructor(address _oracleAddress) {
        oracle = IOraiOracle(_oracleAddress);
    }

    // Calculate dynamic fee: 0.07 base + 0.02 per 10 characters
    function calculateFee(string memory question)
        public pure returns (uint256) {
        uint256 baseFee = 0.07 ether;
        uint256 length = bytes(question).length;
        uint256 additionalFee = (length / 10) * 0.02 ether;
        return baseFee + additionalFee;
    }

    // Ask a question to the oracle
    function askOracle(string memory question) external payable {
        uint256 requiredFee = calculateFee(question);
        require(msg.value >= requiredFee, "Insufficient fee");

        string[] memory refs = new string[](1);
        refs[0] = "null";

        bytes32 questionId = oracle.queryOracle{value: msg.value}(
            question,
            refs
        );

        questionAskers[questionId] = msg.sender;
    }

    // Retrieve the answer
    function getOracleAnswer(bytes32 questionId)
        external view returns (string memory, bool) {
        return oracle.getAnswer(questionId);
    }
}`}
              </pre>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Step 3: Deploy and Use
            </h3>
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Deploy your contract</p>
                    <p className="text-sm text-gray-600">
                      Pass the Orai Oracle contract address: <code className="bg-gray-200 px-2 py-1 rounded text-xs">0x15ED253e953CCf67BB55E328c2FE4bB2183e3b09</code>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Call askOracle function</p>
                    <p className="text-sm text-gray-600">
                      Send at least 0.01 0G with your transaction
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Wait for AI processing</p>
                    <p className="text-sm text-gray-600">
                      The oracle will process your question and submit the verified answer
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Retrieve the answer</p>
                    <p className="text-sm text-gray-600">
                      Use getOracleAnswer with the questionId to get the verified answer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="bg-purple-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Network Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Network</p>
                <p className="text-sm text-gray-600">0G Testnet (Galileo)</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Chain ID</p>
                <p className="text-sm text-gray-600">16602</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Oracle Contract</p>
                <p className="text-sm text-gray-600 font-mono">0x15ED...3b09</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Fee Structure</p>
                <p className="text-sm text-gray-600">0.07 0G + 0.02 0G/10 chars</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}