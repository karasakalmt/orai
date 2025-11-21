# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orai is a decentralized AI-verified oracle system built on 0G infrastructure, combining blockchain technology with decentralized AI inference to provide trustless, verifiable knowledge to smart contracts.

## Common Development Commands

### Initial Setup
```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Update .env with:
# VITE_API_URL=https://api.orai.network (or local backend URL)
# VITE_CHAIN_ID=16600
# VITE_ORACLE_ADDRESS=0x... (from deployed contracts)
# VITE_TOKEN_ADDRESS=0x... (from deployed contracts)
# VITE_WS_URL=wss://api.orai.network/ws
```

### Development
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Run linter
npm run lint

# Format code
npm run format
```

### Building & Testing
```bash
# Production build
npm run build

# Preview production build locally
npm run preview

# Run tests (if configured)
npm test
```

## High-Level Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Web3 Integration**: RainbowKit + Wagmi + Ethers.js v6
- **State Management**: Zustand (client state) + React Query/TanStack Query (server state)
- **Styling**: TailwindCSS with Headless UI components
- **Forms**: React Hook Form with Zod validation

### Key Architectural Patterns

#### 1. Web3 Integration
The frontend uses RainbowKit for wallet connection with 0G testnet configuration:
- Chain ID: 16600 (0G Testnet)
- RPC URL: https://rpc-testnet.0g.ai
- All wallet interactions go through Wagmi hooks (useAccount, useContractWrite, etc.)
- Smart contract calls are made via typed contract interfaces in `lib/contracts/`

#### 2. Oracle Interaction Flow
1. **Question Submission**: User ’ Frontend Form ’ Smart Contract ’ Backend listens to events
2. **Answer Generation**: Backend triggers 0G Compute ’ AI generates answer ’ Stored in 0G Storage
3. **Voting**: Community votes on answer accuracy ’ Smart contract tallies votes
4. **Result Retrieval**: Frontend queries smart contract for verified answers

#### 3. State Management Strategy
- **Zustand**: User preferences, wallet state, UI state
- **React Query**: API data fetching, caching, and synchronization
- **Contract State**: Direct blockchain queries via Wagmi hooks
- **WebSocket**: Real-time updates for answer status and voting

#### 4. Component Organization
- `components/ui/`: Reusable base UI components (Button, Card, Input, Modal)
- `components/oracle/`: Oracle-specific components (QuestionCard, VotingInterface, ProofViewer)
- `components/wallet/`: Web3 connection components
- `pages/`: Route-level components
- `hooks/`: Custom React hooks for business logic

### Critical Integration Points

#### Smart Contract Interface
The oracle contract at `VITE_ORACLE_ADDRESS` provides:
- `submitQuestion()`: Submit new oracle queries
- `getAnswer()`: Retrieve verified answers
- `vote()`: Participate in answer validation
- Events: QuestionSubmitted, AnswerReady, AnswerVerified

#### Backend API Integration
The backend at `VITE_API_URL` provides:
- REST endpoints for question/answer management
- WebSocket connections for real-time updates
- 0G Compute job orchestration
- Storage hash verification

#### Fee Structure
- Base fee: 10 ORAI tokens
- Priority multiplier: 1.5x for faster processing
- Reference URLs: +2 ORAI per URL (up to 5)
- All fees paid in ORAI tokens on 0G network

### Important Considerations

#### Web3 UX Best Practices
1. Always check wallet connection before blockchain interactions
2. Show clear transaction status (pending, success, error)
3. Display gas estimates before transactions
4. Handle MetaMask rejection gracefully
5. Provide fallback UI for users without wallets

#### Oracle-Specific Logic
1. Questions have character limits (10-500 chars)
2. Voting period is 24 hours from answer generation
3. Minimum stake for voting: 100 ORAI tokens
4. Voting power = stake amount × reputation multiplier
5. Slashing: 20% penalty for incorrect votes

#### Performance Optimization
1. Use React.memo for expensive components
2. Implement pagination for question lists
3. Cache contract reads with React Query
4. Lazy load heavy components (voting interface, analytics)
5. Use WebSocket for real-time updates instead of polling

### Environment-Specific Configuration

The application expects these environment variables:
- `VITE_API_URL`: Backend API endpoint
- `VITE_WS_URL`: WebSocket endpoint for real-time updates
- `VITE_CHAIN_ID`: 0G network chain ID (16600 for testnet, 16601 for mainnet)
- `VITE_ORACLE_ADDRESS`: Deployed oracle smart contract address
- `VITE_TOKEN_ADDRESS`: ORAI token contract address
- `VITE_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID for RainbowKit

### Testing Considerations

When testing oracle functionality:
1. Use testnet ORAI tokens from faucet
2. Test with small amounts first
3. Verify answer generation on 0G Compute
4. Check voting mechanism with multiple accounts
5. Validate storage proofs on 0G Storage

### Common Issues & Solutions

1. **Wallet Connection Issues**: Ensure correct chain ID and RPC URL
2. **Transaction Failures**: Check ORAI token balance and gas
3. **WebSocket Disconnections**: Implement reconnection logic
4. **Slow Answer Generation**: Normal for complex questions (up to 30s)
5. **Voting Not Available**: Check if within 24-hour voting window

## Related Documentation

- Frontend technical details: `FRONTEND.md`
- Product requirements: `../PRD.md`
- Backend setup: `../backend/README.md` (if exists)
- Smart contracts: `../contracts/README.md` (if exists)