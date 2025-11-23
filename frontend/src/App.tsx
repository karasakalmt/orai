import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { ConnectButton } from './components/wallet/ConnectButton';
import { NetworkSwitcher } from './components/wallet/NetworkSwitcher';
import { useWeb3 } from './hooks/useWeb3';

// Import pages
import { Home } from './pages/Home';
import { Ask } from './pages/Ask';
import { Browse } from './pages/Browse';

function Layout({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWeb3();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Orai Oracle
                </span>
              </Link>

              {/* Main Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `font-medium transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/ask"
                  className={({ isActive }) =>
                    `font-medium transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                    }`
                  }
                >
                  Ask
                </NavLink>
                <NavLink
                  to="/browse"
                  className={({ isActive }) =>
                    `font-medium transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                    }`
                  }
                >
                  Browse
                </NavLink>
              </nav>
            </div>

            {/* Wallet Controls */}
            <div className="flex items-center gap-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Orai Oracle</h3>
            <p className="text-gray-400 text-sm mb-4">
              Decentralized AI-verified knowledge oracle on 0G Network
            </p>
            <div className="text-sm text-gray-400">
              © 2024 Orai Oracle. Built on 0G Network.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/ask" element={<Layout><Ask /></Layout>} />
        <Route path="/browse" element={<Layout><Browse /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;