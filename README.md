# Orai - Decentralized AI-Verified Oracle Platform

## Introduction

Orai is a decentralized oracle platform that leverages artificial intelligence to verify and validate real-world data for blockchain applications. Built on the 0G Network, Orai provides a trustless mechanism for submitting questions and obtaining AI-verified answers with cryptographic proof verification.

The platform enables users to:
- Submit questions with attached fees to the oracle
- Receive AI-verified answers through decentralized relayers
- Verify answer authenticity through cryptographic proofs
- Build decentralized applications that require verified off-chain data

## Tech Stack

### Smart Contracts
- **Solidity**: v0.8.20
- **Hardhat 3**: Development framework with ESM support
- **OpenZeppelin Contracts**: v5.x for secure, audited contract implementations
- **Network**: 0G Testnet (Chain ID: 16602)

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify (high-performance web framework)
- **Database ORM**: Prisma
- **Blockchain Integration**: Ethers.js v6
- **0G Integration**:
  - `@0glabs/0g-serving-broker` v0.5.4
  - `@0glabs/0g-ts-sdk` v0.3.3
- **Real-time**: WebSocket support via Fastify WebSocket
- **Job Queue**: BullMQ with Redis
- **API Documentation**: Fastify Swagger + Swagger UI

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3.4
- **Wallet Integration**:
  - RainbowKit v2.2
  - Wagmi v2.19
  - Viem v2.39
- **Routing**: React Router DOM v7
- **State Management**: TanStack Query v5

### Development Tools
- **Package Manager**: npm/pnpm
- **Testing**: Hardhat Mocha
- **Type Safety**: TypeScript 5.x across all packages
- **Code Quality**: ESLint, Prettier
- **Containerization**: Docker Compose

## How 0G is Used

Orai leverages the 0G Network as its core infrastructure layer:

### Network Integration
- **Deployment Target**: All smart contracts are deployed to the 0G Testnet
- **RPC Endpoint**: `https://evmrpc-testnet.0g.ai`
- **Chain ID**: 16602
- **Block Explorer**: 0G Scan at `https://scan-testnet.0g.ai`

### 0G SDK Integration
The backend integrates 0G's TypeScript SDK and Serving Broker to:
- **AI Service Orchestration**: Connect to 0G's decentralized AI service network
- **Data Verification**: Utilize 0G's infrastructure for AI-powered answer verification
- **Decentralized Computing**: Leverage 0G's distributed computing resources for oracle operations
- **Service Discovery**: Access 0G's service registry for AI model endpoints

### Key Features on 0G
- **Low Transaction Costs**: Benefit from 0G's optimized gas pricing (25 gwei)
- **Fast Finality**: Rapid transaction confirmation for oracle responses
- **Scalability**: Handle high-throughput oracle requests
- **Decentralization**: Trustless infrastructure without single points of failure

## How Hardhat 3 is Used

Orai utilizes Hardhat 3's latest features and ESM architecture:

### Modern ESM Configuration
- **Native ESM Support**: Full ES modules with `import`/`export` syntax
- **Type Safety**: TypeScript configuration with Hardhat type definitions
- **Plugin System**: Modular architecture using official Hardhat plugins

### Core Plugins
```javascript
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
```

### Network Configuration
- **Simulated Network**: EDR (Ethereum Development Runtime) for local testing
- **Multi-Network Support**: Seamless switching between local and 0G testnet
- **Custom Chain Descriptors**: Extended configuration for 0G Network block explorer integration

### Development Workflow
```bash
# Compile contracts with optimizations
npx hardhat compile

# Run comprehensive test suite
npx hardhat test

# Deploy to 0G testnet
npx hardhat run scripts/deploy-0g-testnet.js --network 0g-testnet

# Verify contracts on 0G Scan
npx hardhat verify --network 0g-testnet <CONTRACT_ADDRESS>
```

### Testing Features
- **Mocha Integration**: Comprehensive test framework with 40s timeout for complex scenarios
- **Gas Optimization**: Compiler runs set to 200 for balanced deployment and execution costs
- **Network Forking**: Test against live 0G testnet state

## Contract Addresses

All contracts are deployed on **0G Testnet** (Chain ID: 16602):

| Contract | Address | Explorer |
|----------|---------|----------|
| **OraiToken** | `0xDE465372A030570e649e76F9adB6b9bB2EE2f7c0` | [View](https://scan-testnet.0g.ai/address/0xDE465372A030570e649e76F9adB6b9bB2EE2f7c0) |
| **VotingContract** | `0x604239Dcb79142D6733c0d9FF03c57f10208D256` | [View](https://scan-testnet.0g.ai/address/0x604239Dcb79142D6733c0d9FF03c57f10208D256) |
| **OracleContract** | `0x15ED253e953CCf67BB55E328c2FE4bB2183e3b09` | [View](https://scan-testnet.0g.ai/address/0x15ED253e953CCf67BB55E328c2FE4bB2183e3b09) |
| **GovernanceContract** | `0x9811232BE9C101ee7cb90b12439b6ac29Bd16139` | [View](https://scan-testnet.0g.ai/address/0x9811232BE9C101ee7cb90b12439b6ac29Bd16139) |

### Contract Configuration
- **Deployer Address**: `0x059181b3C4a7bf7026C6310742877252e285E2da`
- **Deployment Date**: November 22, 2025
- **Minimum Oracle Fee**: 0.01 tokens
- **Reward Distribution**:
  - Treasury: 15%
  - Relayers: 85%

## Project Structure

```
orai/
├── contracts/          # Smart contracts (Hardhat 3 + Solidity)
│   ├── contracts/      # Solidity source files
│   ├── scripts/        # Deployment scripts
│   ├── test/           # Contract tests
│   └── deployments/    # Deployment artifacts
├── backend/            # Fastify API server
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── services/   # Business logic & 0G integration
│   │   └── config/     # Configuration
│   └── prisma/         # Database schema
├── frontend/           # React + Vite application
│   └── src/
│       ├── components/ # UI components
│       ├── pages/      # Route pages
│       └── hooks/      # Custom React hooks
└── postman/            # API testing collection
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm
- Docker (optional, for Redis)
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd orai
```

2. **Install dependencies**
```bash
# Install contract dependencies
cd contracts
npm install

# Install backend dependencies
cd ../backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Environment Setup**

Create `.env` files in each directory:

**contracts/.env**
```env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://evmrpc-testnet.0g.ai
```

**backend/.env**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/orai
REDIS_URL=redis://localhost:6379
CONTRACT_ADDRESS=0x15ED253e953CCf67BB55E328c2FE4bB2183e3b09
PRIVATE_KEY=your_relayer_private_key
```

**frontend/.env**
```env
VITE_CONTRACT_ADDRESS=0x15ED253e953CCf67BB55E328c2FE4bB2183e3b09
VITE_CHAIN_ID=16602
```

### Running the Application

**Start Backend**
```bash
cd backend
npm run dev
```

**Start Frontend**
```bash
cd frontend
npm run dev
```

**Run Tests**
```bash
cd contracts
npx hardhat test
```

## API Documentation

Once the backend is running, access the interactive API documentation at:
- Swagger UI: `http://localhost:3000/documentation`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- All smart contracts use OpenZeppelin's audited implementations
- OWASP Top 10 security measures implemented in backend
- Input validation with Zod schemas
- Rate limiting and CORS protection
- JWT authentication for sensitive endpoints

## License

MIT

## Conclusion

Orai represents a next-generation oracle solution that combines the power of AI verification with blockchain's trustless infrastructure. By building on the 0G Network and utilizing Hardhat 3's modern development features, Orai delivers a scalable, secure, and decentralized platform for real-world data integration.

The platform's cryptographic proof verification ensures answer authenticity and transparency, creating a trustless ecosystem for verified data. Whether you're building DeFi applications, prediction markets, or any dApp requiring verified external data, Orai provides the infrastructure you need.

**Key Advantages**:
- ✅ AI-powered answer verification through 0G's decentralized network
- ✅ Cryptographic proof verification for answer authenticity
- ✅ Low-cost operations on 0G Network
- ✅ Modern development stack with TypeScript and Hardhat 3
- ✅ Production-ready with comprehensive testing and documentation
- ✅ Scalable architecture supporting high-throughput oracle requests

For questions, issues, or contributions, please visit our GitHub repository or join our community channels.

---

**Built with ❤️ on 0G Network**
