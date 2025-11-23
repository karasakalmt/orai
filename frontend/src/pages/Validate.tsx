import { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { apiClient } from '../lib/api/client';

interface ValidationTask {
  id: string;
  questionId: string;
  question: string;
  answer: string;
  references: string[];
  submittedAt: number;
  deadline: number;
  totalValidators: number;
  votesYes: number;
  votesNo: number;
  reward: number;
  status: 'active' | 'completed' | 'expired';
  userVote?: 'yes' | 'no';
}

export function Validate() {
  const { isConnected, address } = useWeb3();
  const [selectedTask, setSelectedTask] = useState<ValidationTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'expired'>('active');
  const [showOnlyUnvoted, setShowOnlyUnvoted] = useState(false);
  const [validations, setValidations] = useState<ValidationTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch validations from API
  useEffect(() => {
    const fetchValidations = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (filterStatus !== 'all') params.status = filterStatus;
        if (address) params.validator = address;
        if (showOnlyUnvoted) params.unvoted = true;

        const response = await apiClient.getValidations(params);
        setValidations(response.validations || []);
      } catch (error) {
        console.error('Failed to fetch validations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      fetchValidations();
    }
  }, [filterStatus, showOnlyUnvoted, address, isConnected]);

  const filteredTasks = validations;

  const getTimeRemaining = (deadline: number) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getConsensusPercentage = (task: ValidationTask) => {
    const total = task.votesYes + task.votesNo;
    if (total === 0) return 0;
    return Math.round((task.votesYes / total) * 100);
  };

  const handleVote = (taskId: string, vote: 'yes' | 'no') => {
    console.log(`Voting ${vote} on task ${taskId}`);
    // TODO: Implement smart contract interaction
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-3xl font-bold mb-4">Validator Access Required</h2>
            <p className="text-gray-600 text-lg mb-6">
              Connect your wallet and stake ORAI to become a validator
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Validator Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Validate answers and earn rewards for maintaining truth
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
              {(['all', 'active', 'completed', 'expired'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyUnvoted}
                onChange={(e) => setShowOnlyUnvoted(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <span className="text-gray-700">Show only unvoted</span>
            </label>
          </div>
        </div>

        {/* Validation Tasks Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all"
            >
              {/* Task Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {task.status === 'active' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {getTimeRemaining(task.deadline)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {task.question}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-purple-600">{task.reward} ORAI</div>
                  <div className="text-xs text-gray-500">Reward</div>
                </div>
              </div>

              {/* Answer Preview */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-gray-700 text-sm line-clamp-3">
                  {task.answer}
                </p>
                {task.references.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    📚 {task.references.length} reference{task.references.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Voting Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Consensus: {getConsensusPercentage(task)}%</span>
                  <span>{task.votesYes + task.votesNo}/{task.totalValidators} validators</span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-green-500 transition-all"
                    style={{ width: `${(task.votesYes / task.totalValidators) * 100}%` }}
                  />
                  <div
                    className="absolute top-0 h-full bg-red-500 transition-all"
                    style={{
                      left: `${(task.votesYes / task.totalValidators) * 100}%`,
                      width: `${(task.votesNo / task.totalValidators) * 100}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>✓ {task.votesYes} Yes</span>
                  <span>✗ {task.votesNo} No</span>
                </div>
              </div>

              {/* Action Buttons */}
              {task.status === 'active' && (
                <div className="flex gap-2">
                  {!task.userVote ? (
                    <>
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium"
                      >
                        Review Full Answer
                      </button>
                      <button
                        onClick={() => handleVote(task.id, 'yes')}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-medium"
                      >
                        ✓ Valid
                      </button>
                      <button
                        onClick={() => handleVote(task.id, 'no')}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium"
                      >
                        ✗ Invalid
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 text-center py-2 px-4 bg-gray-100 rounded-xl">
                      <span className="text-gray-600">
                        You voted: <span className="font-semibold">{task.userVote === 'yes' ? '✓ Valid' : '✗ Invalid'}</span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {task.status === 'completed' && (
                <div className="text-center py-2 px-4 bg-gray-100 rounded-xl">
                  <span className="text-gray-600">
                    Validation completed • {getConsensusPercentage(task)}% consensus
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No validation tasks available</h3>
            <p className="text-gray-600">
              Check back later for new tasks to validate
            </p>
          </div>
        )}

        {/* Selected Task Modal */}
        {selectedTask && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTask(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">{selectedTask.question}</h2>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-2">Answer:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedTask.answer}</p>
              </div>

              {selectedTask.references.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">References:</h3>
                  <ul className="space-y-1">
                    {selectedTask.references.map((ref, i) => (
                      <li key={i}>
                        <a
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {ref}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleVote(selectedTask.id, 'yes');
                    setSelectedTask(null);
                  }}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                >
                  ✓ Validate as Correct
                </button>
                <button
                  onClick={() => {
                    handleVote(selectedTask.id, 'no');
                    setSelectedTask(null);
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                >
                  ✗ Mark as Incorrect
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}