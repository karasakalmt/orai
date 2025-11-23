import { Link } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';

export function Home() {
  const { isConnected } = useWeb3();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Orai Oracle
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto">
              Decentralized AI-Verified Knowledge Oracle on 0G Network
            </p>
            <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
              Get trustless, verifiable answers powered by distributed AI inference and community validation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isConnected ? (
                <Link
                  to="/ask"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-xl"
                >
                  Ask the Oracle
                </Link>
              ) : (
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-xl">
                  Connect Wallet to Start
                </button>
              )}
              <Link
                to="/browse"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all transform hover:scale-105"
              >
                Browse Questions
              </Link>
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Orai Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to verified knowledge
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Ask Your Question</h3>
              <p className="text-gray-600">
                Submit any question to the oracle. Pay a small fee in ORAI tokens for processing.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Processing</h3>
              <p className="text-gray-600">
                Distributed AI nodes on 0G Network process your question and generate verified answers.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Validation</h3>
              <p className="text-gray-600">
                Token holders vote on answer accuracy. Consensus determines the final verified result.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Use Cases
            </h2>
            <p className="text-xl text-gray-600">
              Powering decentralized applications with verified knowledge
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="text-3xl mb-4">🏦</div>
              <h3 className="text-lg font-semibold mb-2">DeFi Protocols</h3>
              <p className="text-gray-600 text-sm">
                Risk assessment, market analysis, and compliance verification
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="text-3xl mb-4">🎲</div>
              <h3 className="text-lg font-semibold mb-2">Prediction Markets</h3>
              <p className="text-gray-600 text-sm">
                Ground truth for event resolution and dispute settlement
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="text-3xl mb-4">🗳️</div>
              <h3 className="text-lg font-semibold mb-2">DAO Governance</h3>
              <p className="text-gray-600 text-sm">
                Factual information for proposal evaluation
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="text-3xl mb-4">🎮</div>
              <h3 className="text-lg font-semibold mb-2">On-chain Games</h3>
              <p className="text-gray-600 text-sm">
                Dynamic game state updates and event outcomes
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="text-3xl mb-4">💻</div>
              <h3 className="text-lg font-semibold mb-2">DApp Development</h3>
              <p className="text-gray-600 text-sm">
                Reliable off-chain truth integration
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="text-3xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Research</h3>
              <p className="text-gray-600 text-sm">
                Fact-checking and decision support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Architecture */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Built on Cutting-Edge Technology
            </h2>
            <p className="text-lg text-gray-600">
              Powered by 0G Network and decentralized infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 0G Network */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mb-4 flex items-center justify-center text-white text-xl">
                ⛓️
              </div>
              <h3 className="font-bold text-gray-900 mb-2">0G Network</h3>
              <p className="text-sm text-gray-600 mb-3">
                High-performance blockchain designed for AI and data-intensive applications
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Chain ID: 16602</li>
                <li>• Native 0G token</li>
                <li>• Fast finality</li>
              </ul>
            </div>

            {/* 0G Storage */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center text-white text-xl">
                💾
              </div>
              <h3 className="font-bold text-gray-900 mb-2">0G Storage</h3>
              <p className="text-sm text-gray-600 mb-3">
                Decentralized data storage with verifiable proofs and high availability
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• AI model storage</li>
                <li>• Proof generation</li>
                <li>• Data persistence</li>
              </ul>
            </div>

            {/* Smart Contracts */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg mb-4 flex items-center justify-center text-white text-xl">
                📝
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Smart Contracts</h3>
              <p className="text-sm text-gray-600 mb-3">
                Secure Solidity contracts managing all oracle operations
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Question storage</li>
                <li>• Answer verification</li>
                <li>• Fee management</li>
              </ul>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg mb-4 flex items-center justify-center text-white text-xl">
                🔒
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Security</h3>
              <p className="text-sm text-gray-600 mb-3">
                Enterprise-grade security with multiple protection layers
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Access control</li>
                <li>• Reentrancy guards</li>
                <li>• Pausable system</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Access Verified Knowledge?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join the decentralized oracle revolution on 0G Network
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/ask"
              className="px-8 py-4 bg-white text-blue-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Start Asking Questions
            </Link>
            <a
              href="https://docs.0g.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-transparent border-2 border-white rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-900 transition-all transform hover:scale-105"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}