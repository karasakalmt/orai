import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';
import { apiClient } from '../lib/api/client';
import { useWatchContractEvent, usePublicClient, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../lib/contracts/config';
import { decodeEventLog } from 'viem';

interface Question {
  id: string;
  question: string;
  answer?: string;
  status: 'pending' | 'processing' | 'answered' | 'validated';
  asker: string;
  timestamp: number;
  fee: number;
  isPriority: boolean;
  votes?: { yes: number; no: number };
  references?: string[];
  verification?: {
    verified: boolean;
    modelHash: string;
    inputHash: string;
    outputHash: string;
    evidenceSummary: string;
  };
  storage?: {
    storageHash: string;
    storageUrl: string;
    timestamp: number;
  };
}

export function Browse() {
  const location = useLocation();
  const publicClient = usePublicClient();
  const { isConnected, address } = useWeb3();
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'fee' | 'votes'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Submission modal state
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionData, setSubmissionData] = useState<{
    question: string;
    transactionHash: string;
    questionId?: string;
    answer?: string;
    timestamp: number;
  } | null>(null);

  // Check for submission from location state and get questionId from tx receipt
  useEffect(() => {
    const state = location.state as any;
    if (state?.submittedQuestion && state?.transactionHash) {
      setSubmissionData({
        question: state.submittedQuestion,
        transactionHash: state.transactionHash,
        timestamp: state.timestamp || Date.now()
      });
      setShowSubmissionModal(true);

      // Get questionId from transaction receipt
      const getQuestionId = async () => {
        try {
          if (!publicClient) return;

          const receipt = await publicClient.getTransactionReceipt({
            hash: state.transactionHash as `0x${string}`
          });

          // Find QuestionSubmitted event in logs
          const questionSubmittedEvent = receipt.logs.find(log => {
            try {
              const decoded = decodeEventLog({
                abi: CONTRACT_ABIS.OracleContract,
                data: log.data,
                topics: log.topics
              });
              return decoded.eventName === 'QuestionSubmitted';
            } catch {
              return false;
            }
          });

          if (questionSubmittedEvent) {
            const decoded = decodeEventLog({
              abi: CONTRACT_ABIS.OracleContract,
              data: questionSubmittedEvent.data,
              topics: questionSubmittedEvent.topics
            });

            const questionId = decoded.topics?.[1] as string;
            console.log('Question ID from receipt:', questionId);

            setSubmissionData(prev => prev ? {
              ...prev,
              questionId
            } : null);
          }
        } catch (error) {
          console.error('Error getting questionId from receipt:', error);
        }
      };

      getQuestionId();

      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location, publicClient]);

  // Poll for existing answer from contract
  useEffect(() => {
    if (!submissionData?.questionId || submissionData.answer) return;

    const checkForAnswer = async () => {
      try {
        if (!publicClient) return;

        const result = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.OracleContract as `0x${string}`,
          abi: CONTRACT_ABIS.OracleContract,
          functionName: 'getAnswer',
          args: [submissionData.questionId as `0x${string}`]
        }) as [string, boolean];

        const [answer, verified] = result;

        console.log('Checking for answer:', {
          questionId: submissionData.questionId,
          answer,
          verified,
          hasAnswer: answer && answer.length > 0
        });

        if (answer && answer.length > 0) {
          setSubmissionData(prev => prev ? {
            ...prev,
            answer
          } : null);
        }
      } catch (error) {
        console.error('Error checking for answer:', error);
      }
    };

    // Check immediately
    checkForAnswer();

    // Then poll every 2 seconds
    const interval = setInterval(checkForAnswer, 2000);

    return () => clearInterval(interval);
  }, [submissionData?.questionId, submissionData?.answer, publicClient]);

  // Watch for AnswerSubmitted event (for real-time updates)
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.OracleContract as `0x${string}`,
    abi: CONTRACT_ABIS.OracleContract,
    eventName: 'AnswerSubmitted',
    onLogs(logs) {
      if (!submissionData?.questionId) return;

      logs.forEach((log) => {
        const decoded = log.args as any;
        const eventQuestionId = decoded.questionId;

        console.log('AnswerSubmitted event:', {
          eventQuestionId,
          ourQuestionId: submissionData.questionId,
          match: eventQuestionId === submissionData.questionId
        });

        // Check if this answer is for our question
        if (eventQuestionId === submissionData.questionId) {
          const answer = decoded.answer as string;
          console.log('Answer received from event:', answer);

          setSubmissionData(prev => prev ? {
            ...prev,
            answer
          } : null);
        }
      });
    }
  });

  // Fetch questions from API and localStorage
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);

        // ALWAYS fetch all questions from API first to get complete dataset
        const allResponse = await apiClient.getQuestions({});

        // Transform API data to match Question interface
        // Handle both response formats: {data: [...]} and {questions: [...]}
        const allQuestionsArray = allResponse?.data || allResponse?.questions || [];
        const allApiQuestions = allQuestionsArray.map((q: any) => ({
          id: q.id || q.questionId,
          question: q.question || q.questionText,
          answer: typeof q.answer === 'string' ? q.answer : (q.answer?.answerText || ''),
          status: q.status,
          asker: q.asker || q.submitter,
          timestamp: typeof q.timestamp === 'number' ? q.timestamp : new Date(q.timestamp).getTime(),
          fee: typeof q.fee === 'number' ? q.fee : parseFloat(q.fee || q.feePaid || '0'),
          isPriority: q.isPriority || false,
          votes: q.votes || { yes: 0, no: 0 },
          references: q.references || q.referenceUrls || [],
          verification: q.verification,
          storage: q.storage
        }));

        // Get questions from localStorage
        const localQuestions = JSON.parse(localStorage.getItem('orai_questions') || '[]');

        // Sync localStorage with API - ONLY keep questions that exist in API
        // localStorage cannot have more items than API shows
        const syncedLocalQuestions = localQuestions.filter((local: any) => {
          return allApiQuestions.some(q =>
            q.id === local.transactionHash ||
            q.question === local.question
          );
        });

        // Always update localStorage to match API
        localStorage.setItem('orai_questions', JSON.stringify(syncedLocalQuestions));

        // Use API data as the source of truth
        let displayQuestions = [...allApiQuestions];

        // Apply filter
        if (filter === 'pending') {
          displayQuestions = displayQuestions.filter(q => q.status === 'pending');
        } else if (filter === 'answered') {
          displayQuestions = displayQuestions.filter(q => q.status === 'answered');
        }
        // 'all' shows everything, no filtering needed

        // Apply sorting
        let sorted = [...displayQuestions];
        if (sortBy === 'fee') {
          sorted.sort((a, b) => b.fee - a.fee);
        } else if (sortBy === 'votes') {
          sorted.sort((a, b) => {
            const aVotes = (a.votes?.yes || 0) + (a.votes?.no || 0);
            const bVotes = (b.votes?.yes || 0) + (b.votes?.no || 0);
            return bVotes - aVotes;
          });
        } else {
          sorted.sort((a, b) => b.timestamp - a.timestamp);
        }

        // Apply search filter
        if (searchQuery) {
          sorted = sorted.filter(q =>
            q.question.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setQuestions(sorted);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        // If API fails, clear localStorage and show empty state
        // We can't trust localStorage if API is unavailable
        localStorage.setItem('orai_questions', JSON.stringify([]));
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [filter, sortBy, searchQuery, address]);

  const filteredQuestions = questions;

  const getStatusColor = (status: Question['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'answered':
        return 'bg-purple-100 text-purple-800';
      case 'validated':
        return 'bg-green-100 text-green-800';
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Browse Questions
          </h1>
          <p className="text-xl text-gray-600">
            Explore community questions and AI-verified answers
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'pending', 'answered'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
                    filter === status
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="fee">Highest Fee</option>
            </select>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4 text-sm text-gray-600">
            <span>{filteredQuestions.length} questions</span>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <div key={question.id} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {/* Question Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(question.status)}`}>
                      {question.status}
                    </span>
                    {question.isPriority && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                        ⚡ Priority
                      </span>
                    )}
                    <span className="text-gray-500 text-sm">
                      {getTimeAgo(question.timestamp)}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {question.question}
                  </h3>

                  {/* Answer if available */}
                  {question.answer && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-gray-700">{question.answer}</p>
                    </div>
                  )}

                  {/* Show Details Button */}
                  {(question.verification || question.storage) && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedQuestionId(expandedQuestionId === question.id ? null : question.id)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                      >
                        {expandedQuestionId === question.id ? 'Hide Details' : 'Show Details'}
                      </button>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedQuestionId === question.id && (question.verification || question.storage) && (
                    <div className="mt-4 space-y-4">
                      {/* Verification Info */}
                      {question.verification && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            Verification
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${question.verification.verified ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                {question.verification.verified ? '✓ Verified' : '✗ Not Verified'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Model Hash:</span>
                              <p className="font-mono text-xs text-gray-800 break-all">{question.verification.modelHash}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Input Hash:</span>
                              <p className="font-mono text-xs text-gray-800 break-all">{question.verification.inputHash}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Output Hash:</span>
                              <p className="font-mono text-xs text-gray-800 break-all">{question.verification.outputHash}</p>
                            </div>
                            {question.verification.evidenceSummary && (
                              <div>
                                <span className="text-gray-600">Evidence Summary:</span>
                                <p className="text-gray-800 mt-1">{question.verification.evidenceSummary}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Storage Info */}
                      {question.storage && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/>
                              <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/>
                              <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>
                            </svg>
                            0G Storage
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Storage Hash:</span>
                              <p className="font-mono text-xs text-gray-800 break-all">{question.storage.storageHash}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Storage URL:</span>
                              <a
                                href={question.storage.storageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-xs break-all block"
                              >
                                {question.storage.storageUrl}
                              </a>
                            </div>
                            <div>
                              <span className="text-gray-600">Timestamp:</span>
                              <p className="text-gray-800">{new Date(question.storage.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span>Asked by {question.asker}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredQuestions.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No questions found</h3>
            <p className="text-gray-600">
              Try adjusting your filters or search query
            </p>
          </div>
        )}

        {/* Load More */}
        {filteredQuestions.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
              Load More Questions
            </button>
          </div>
        )}

        {/* Submission Modal */}
        {showSubmissionModal && submissionData && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowSubmissionModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Question Submitted!</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Transaction: {submissionData.transactionHash.slice(0, 10)}...{submissionData.transactionHash.slice(-8)}
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Your Question:</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700">{submissionData.question}</p>
                </div>
              </div>

              {/* Answer Section */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Answer:</h3>
                <div className="bg-blue-50 rounded-xl p-6 min-h-[120px] flex items-center justify-center">
                  {!submissionData.answer ? (
                    <div className="text-center">
                      {/* Loading Spinner */}
                      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
                      <p className="text-gray-600">Waiting for answer from oracle...</p>
                      <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="h-4 w-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                        <span className="text-green-700 font-semibold">Answer Received!</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{submissionData.answer}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Close
                </button>
                {submissionData.answer && (
                  <button
                    onClick={() => {
                      window.open(`https://chainscan-galileo.0g.ai/tx/${submissionData.transactionHash}`, '_blank');
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold"
                  >
                    View on Explorer
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}