import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Orai - Decentralized AI Oracle
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Orai</h2>
          <p className="text-gray-600 mb-6">
            Get verified AI-powered answers on the blockchain.
          </p>

          <div className="space-y-4">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => setCount(count + 1)}
            >
              Counter: {count}
            </button>

            <div className="p-4 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">
                This is a placeholder. Web3 integration and components coming soon!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;