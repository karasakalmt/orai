# Orai Frontend Documentation

**Version:** 1.0  
**Framework:** React 18 + TypeScript  
**Build Tool:** Vite

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Core Features](#core-features)
6. [Components](#components)
7. [State Management](#state-management)
8. [Web3 Integration](#web3-integration)
9. [Styling](#styling)
10. [Deployment](#deployment)

---

## 1. Overview

The Orai frontend provides a user-friendly interface for interacting with the decentralized AI oracle. Users can submit questions, vote on answers, track their activity, and integrate with the oracle via smart contracts.

### Key Features

- Wallet connection (RainbowKit)
- Question submission with fee estimation
- Real-time answer tracking
- Community voting interface
- User dashboard and history
- Developer documentation
- Analytics and statistics

---

## 2. Tech Stack

### Core

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation

### Web3

- **RainbowKit** - Wallet connection
- **Wagmi** - React hooks for Ethereum
- **Ethers.js v6** - Ethereum library
- **Viem** - Type-safe Ethereum utilities

### UI/Styling

- **TailwindCSS** - Utility-first CSS
- **Headless UI** - Accessible components
- **Lucide React** - Icons
- **Recharts** - Data visualization

### State & Data

- **React Query (TanStack Query)** - Server state
- **Zustand** - Client state
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Utilities

- **date-fns** - Date formatting
- **clsx** - Conditional classNames
- **React Hot Toast** - Notifications

---

## 3. Project Structure

```
src/
├── assets/              # Static assets
│   ├── images/
│   └── fonts/
├── components/          # Reusable components
│   ├── ui/             # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Spinner.tsx
│   ├── wallet/         # Wallet-related
│   │   ├── ConnectButton.tsx
│   │   └── WalletInfo.tsx
│   ├── oracle/         # Oracle-specific
│   │   ├── QuestionCard.tsx
│   │   ├── AnswerDisplay.tsx
│   │   ├── VotingInterface.tsx
│   │   └── ProofViewer.tsx
│   └── layout/         # Layout components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
├── pages/              # Page components
│   ├── Home.tsx
│   ├── AskOracle.tsx
│   ├── QuestionDetail.tsx
│   ├── Browse.tsx
│   ├── Voting.tsx
│   ├── MySubmissions.tsx
│   ├── Analytics.tsx
│   └── Docs.tsx
├── hooks/              # Custom React hooks
│   ├── useOracle.ts
│   ├── useVoting.ts
│   ├── useWebSocket.ts
│   └── useUserStats.ts
├── lib/                # Core utilities
│   ├── contracts/      # Contract ABIs and addresses
│   │   ├── OracleContract.ts
│   │   ├── OraiToken.ts
│   │   └── addresses.ts
│   ├── api/           # API client
│   │   ├── client.ts
│   │   └── endpoints.ts
│   └── utils/         # Helper functions
│       ├── formatting.ts
│       ├── validation.ts
│       └── constants.ts
├── store/              # State management
│   ├── userStore.ts
│   └── notificationStore.ts
├── types/              # TypeScript types
│   ├── oracle.ts
│   ├── api.ts
│   └── user.ts
├── styles/             # Global styles
│   ├── globals.css
│   └── tailwind.css
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── config.ts           # App configuration
```

---

## 4. Setup & Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/orai-frontend
cd orai-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your values
# VITE_API_URL=https://api.orai.network
# VITE_CHAIN_ID=16600
# VITE_ORACLE_ADDRESS=0x...
# VITE_TOKEN_ADDRESS=0x...
# VITE_WS_URL=wss://api.orai.network/ws

# Start development server
npm run dev
```

### Development

```bash
# Run dev server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 5. Core Features

### 5.1 Wallet Connection

**Component:** `ConnectButton.tsx`

```typescript
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletConnect() {
  return (
    <ConnectButton 
      chainStatus="icon"
      showBalance={true}
      accountStatus={{
        smallScreen: 'avatar',
        largeScreen: 'full',
      }}
    />
  );
}
```

**Setup:** `main.tsx`

```typescript
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

// Define 0G chain
const ogChain = {
  id: 16600,
  name: '0G Testnet',
  network: '0g-testnet',
  nativeCurrency: {
    name: 'OG',
    symbol: 'OG',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc-testnet.0g.ai'] },
    public: { http: ['https://rpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { 
      name: '0G Explorer', 
      url: 'https://explorer-testnet.0g.ai' 
    },
  },
  testnet: true,
};

const { chains, publicClient } = configureChains(
  [ogChain],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Orai Oracle',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

root.render(
  <WagmiConfig config={wagmiConfig}>
    <RainbowKitProvider chains={chains}>
      <App />
    </RainbowKitProvider>
  </WagmiConfig>
);
```

### 5.2 Question Submission

**Component:** `AskOracle.tsx`

```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccount } from 'wagmi';
import { useSubmitQuestion } from '@/hooks/useOracle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

const questionSchema = z.object({
  question: z.string()
    .min(10, 'Question must be at least 10 characters')
    .max(500, 'Question must be at most 500 characters'),
  referenceUrls: z.array(z.string().url()).max(5).optional(),
  isPriority: z.boolean(),
});

type QuestionForm = z.infer<typeof questionSchema>;

export function AskOracle() {
  const { address } = useAccount();
  const { submitQuestion, isLoading, estimateFee } = useSubmitQuestion();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      isPriority: false,
      referenceUrls: [],
    },
  });
  
  const watchedValues = watch();
  const estimatedFee = estimateFee(watchedValues);
  
  const onSubmit = async (data: QuestionForm) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      const questionId = await submitQuestion(data);
      toast.success('Question submitted successfully!');
      // Navigate to question detail
      window.location.href = `/questions/${questionId}`;
    } catch (error) {
      toast.error('Failed to submit question');
      console.error(error);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Ask the Oracle</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Question Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Your Question
          </label>
          <textarea
            {...register('question')}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="What would you like to know?"
          />
          {errors.question && (
            <p className="text-red-500 text-sm mt-1">
              {errors.question.message}
            </p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            {watchedValues.question?.length || 0} / 500 characters
          </p>
        </div>
        
        {/* Reference URLs */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Reference URLs (Optional)
          </label>
          <input
            type="url"
            {...register('referenceUrls.0')}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="https://example.com"
          />
          <p className="text-gray-500 text-sm mt-1">
            Add up to 5 reference URLs (+2 ORAI each)
          </p>
        </div>
        
        {/* Priority Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            {...register('isPriority')}
            className="mr-2"
            id="priority"
          />
          <label htmlFor="priority" className="text-sm">
            High Priority (+50% fee, 4x faster)
          </label>
        </div>
        
        {/* Fee Estimate */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span>Base Fee:</span>
            <span>10 ORAI</span>
          </div>
          {watchedValues.isPriority && (
            <div className="flex justify-between mb-2">
              <span>Priority Multiplier:</span>
              <span>+5 ORAI</span>
            </div>
          )}
          {watchedValues.referenceUrls?.filter(Boolean).length > 0 && (
            <div className="flex justify-between mb-2">
              <span>Reference URLs:</span>
              <span>
                +{watchedValues.referenceUrls.filter(Boolean).length * 2} ORAI
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total:</span>
            <span>{estimatedFee} ORAI</span>
          </div>
        </div>
        
        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !address}
          className="w-full"
        >
          {isLoading ? 'Submitting...' : 'Submit Question'}
        </Button>
      </form>
    </div>
  );
}
```

### 5.3 Question Detail & Answer Display

**Component:** `QuestionDetail.tsx`

```typescript
import { useParams } from 'react-router-dom';
import { useQuestion, useAnswer } from '@/hooks/useOracle';
import { VotingInterface } from '@/components/oracle/VotingInterface';
import { ProofViewer } from '@/components/oracle/ProofViewer';
import { formatDistanceToNow } from 'date-fns';

export function QuestionDetail() {
  const { questionId } = useParams<{ questionId: string }>();
  const { data: question, isLoading: questionLoading } = useQuestion(questionId);
  const { data: answer, isLoading: answerLoading } = useAnswer(questionId);
  
  if (questionLoading || answerLoading) {
    return <div>Loading...</div>;
  }
  
  if (!question) {
    return <div>Question not found</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Question Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold flex-1">
            {question.questionText}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm ${
            question.state === 'Verified' 
              ? 'bg-green-100 text-green-800'
              : question.state === 'Rejected'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {question.state}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 space-x-4">
          <span>Asked by {question.submitter.slice(0, 8)}...</span>
          <span>
            {formatDistanceToNow(new Date(question.timestamp), { 
              addSuffix: true 
            })}
          </span>
          {question.isPriority && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
              Priority
            </span>
          )}
        </div>
        
        {question.referenceUrls.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Reference URLs:</p>
            <ul className="space-y-1">
              {question.referenceUrls.map((url, idx) => (
                <li key={idx}>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Answer Section */}
      {answer && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Answer</h2>
          
          <div className="prose max-w-none mb-6">
            <p className="text-gray-800 leading-relaxed">
              {answer.answerText}
            </p>
          </div>
          
          {/* Confidence Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Confidence</span>
              <span className="text-sm font-bold">{answer.confidence}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${answer.confidence}%` }}
              />
            </div>
          </div>
          
          {/* Evidence */}
          {answer.evidence && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Supporting Evidence</h3>
              <p className="text-gray-700 text-sm">
                {answer.evidence}
              </p>
            </div>
          )}
          
          {/* Computation Proof */}
          <ProofViewer 
            storageHash={answer.storageHash}
            proofHash={answer.proofHash}
            modelHash={answer.modelHash}
            inputHash={answer.inputHash}
          />
        </div>
      )}
      
      {/* Voting Section */}
      {question.state === 'VotingActive' && answer && (
        <VotingInterface 
          questionId={questionId!} 
          currentAnswer={answer}
        />
      )}
      
      {/* Voting Results */}
      {question.state === 'Verified' || question.state === 'Rejected' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Voting Results</h2>
          {/* Display voting statistics */}
        </div>
      )}
    </div>
  );
}
```

### 5.4 Voting Interface

**Component:** `VotingInterface.tsx`

```typescript
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useVote } from '@/hooks/useVoting';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

enum VoteType {
  Correct = 0,
  Incorrect = 1,
  Uncertain = 2,
  Flag = 3,
}

interface VotingInterfaceProps {
  questionId: string;
  currentAnswer: any;
}

export function VotingInterface({ questionId, currentAnswer }: VotingInterfaceProps) {
  const { address } = useAccount();
  const { vote, isLoading } = useVote();
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
  const [stakeAmount, setStakeAmount] = useState('100');
  
  const handleVote = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (selectedVote === null) {
      toast.error('Please select a vote type');
      return;
    }
    
    try {
      await vote({
        questionId,
        voteType: selectedVote,
        stakeAmount: parseFloat(stakeAmount),
      });
      toast.success('Vote cast successfully!');
    } catch (error) {
      toast.error('Failed to cast vote');
      console.error(error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Cast Your Vote</h2>
      
      <p className="text-gray-600 mb-6">
        Review the answer and vote on its correctness. Your stake will be locked
        until voting ends.
      </p>
      
      {/* Vote Options */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setSelectedVote(VoteType.Correct)}
          className={`p-4 border-2 rounded-lg text-center transition-all ${
            selectedVote === VoteType.Correct
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="text-3xl mb-2">✅</div>
          <div className="font-medium">Correct</div>
          <div className="text-sm text-gray-600">
            Answer is accurate
          </div>
        </button>
        
        <button
          onClick={() => setSelectedVote(VoteType.Incorrect)}
          className={`p-4 border-2 rounded-lg text-center transition-all ${
            selectedVote === VoteType.Incorrect
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="text-3xl mb-2">❌</div>
          <div className="font-medium">Incorrect</div>
          <div className="text-sm text-gray-600">
            Answer is wrong
          </div>
        </button>
        
        <button
          onClick={() => setSelectedVote(VoteType.Uncertain)}
          className={`p-4 border-2 rounded-lg text-center transition-all ${
            selectedVote === VoteType.Uncertain
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 hover:border-yellow-300'
          }`}
        >
          <div className="text-3xl mb-2">🤔</div>
          <div className="font-medium">Uncertain</div>
          <div className="text-sm text-gray-600">
            Can't determine
          </div>
        </button>
        
        <button
          onClick={() => setSelectedVote(VoteType.Flag)}
          className={`p-4 border-2 rounded-lg text-center transition-all ${
            selectedVote === VoteType.Flag
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-orange-300'
          }`}
        >
          <div className="text-3xl mb-2">🚩</div>
          <div className="font-medium">Flag</div>
          <div className="text-sm text-gray-600">
            Needs review
          </div>
        </button>
      </div>
      
      {/* Stake Amount */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Stake Amount (ORAI)
        </label>
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          min="100"
          max="10000"
          step="10"
          className="w-full px-4 py-2 border rounded-lg"
        />
        <p className="text-sm text-gray-600 mt-1">
          Min: 100 ORAI, Max: 10,000 ORAI
        </p>
      </div>
      
      {/* Voting Power Display */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Your Stake:</span>
          <span className="font-medium">{stakeAmount} ORAI</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span>Reputation Multiplier:</span>
          <span className="font-medium">1.2x</span>
        </div>
        <div className="flex justify-between text-sm font-bold pt-2 border-t">
          <span>Voting Power:</span>
          <span>{(parseFloat(stakeAmount) * 1.2).toFixed(2)}</span>
        </div>
      </div>
      
      {/* Submit Button */}
      <Button
        onClick={handleVote}
        disabled={isLoading || selectedVote === null || !address}
        className="w-full"
      >
        {isLoading ? 'Casting Vote...' : 'Cast Vote'}
      </Button>
      
      {/* Info */}
      <p className="text-sm text-gray-600 mt-4 text-center">
        Your stake will be locked until voting ends. Correct votes earn rewards,
        incorrect votes are slashed 20%.
      </p>
    </div>
  );
}
```

---

## 6. Components

### 6.1 UI Components

#### Button

```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'rounded-lg font-medium transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-200 text-gray-800 hover:bg-gray-300': variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
```

#### Card

```typescript
import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, hoverable, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow',
        hoverable && 'transition-shadow hover:shadow-lg cursor-pointer',
        className
      )}
      {...props}
    />
  );
}
```

### 6.2 Oracle Components

See examples above for:
- QuestionCard
- AnswerDisplay
- VotingInterface
- ProofViewer

---

## 7. State Management

### 7.1 User Store (Zustand)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  reputation: number;
  totalVotes: number;
  correctVotes: number;
  totalEarnings: number;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  setReputation: (reputation: number) => void;
  incrementVotes: () => void;
  updatePreferences: (preferences: Partial<UserState['preferences']>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      reputation: 0,
      totalVotes: 0,
      correctVotes: 0,
      totalEarnings: 0,
      preferences: {
        theme: 'light',
        notifications: true,
      },
      setReputation: (reputation) => set({ reputation }),
      incrementVotes: () => 
        set((state) => ({ totalVotes: state.totalVotes + 1 })),
      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
    }),
    {
      name: 'orai-user-storage',
    }
  )
);
```

---

## 8. Web3 Integration

### 8.1 Custom Hooks

#### useOracle.ts

```typescript
import { useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import OracleABI from '@/lib/contracts/OracleContract';
import { ORACLE_ADDRESS } from '@/lib/contracts/addresses';

export function useSubmitQuestion() {
  const { config } = usePrepareContractWrite({
    address: ORACLE_ADDRESS,
    abi: OracleABI,
    functionName: 'submitQuestion',
  });
  
  const { write, isLoading } = useContractWrite(config);
  
  const submitQuestion = async (data: {
    question: string;
    referenceUrls?: string[];
    isPriority: boolean;
  }) => {
    const { question, referenceUrls = [], isPriority } = data;
    
    return write?.({
      args: [question, referenceUrls, isPriority],
    });
  };
  
  const estimateFee = (data: any) => {
    let fee = 10;
    if (data.isPriority) fee *= 1.5;
    fee += (data.referenceUrls?.filter(Boolean).length || 0) * 2;
    return fee;
  };
  
  return { submitQuestion, isLoading, estimateFee };
}

export function useQuestion(questionId: string) {
  return useContractRead({
    address: ORACLE_ADDRESS,
    abi: OracleABI,
    functionName: 'questions',
    args: [questionId],
  });
}

export function useAnswer(questionId: string) {
  return useContractRead({
    address: ORACLE_ADDRESS,
    abi: OracleABI,
    functionName: 'getAnswer',
    args: [questionId],
  });
}
```

### 8.2 WebSocket Connection

```typescript
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface WebSocketMessage {
  type: 'ANSWER_READY' | 'VOTING_STARTED' | 'VOTING_ENDED';
  questionId: string;
  data: any;
}

export function useWebSocket() {
  const { address } = useAccount();
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  
  useEffect(() => {
    if (!address) return;
    
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}?address=${address}`);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };
    
    return () => ws.close();
  }, [address]);
  
  return { messages };
}
```

---

## 9. Styling

### 9.1 Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          // ... more shades
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### 9.2 Global Styles

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors;
  }
}
```

---

## 10. Deployment

### 10.1 Build

```bash
# Production build
npm run build

# Output in dist/
```

### 10.2 Environment Variables

```env
# Production
VITE_API_URL=https://api.orai.network
VITE_WS_URL=wss://api.orai.network/ws
VITE_CHAIN_ID=16601
VITE_ORACLE_ADDRESS=0x...
VITE_TOKEN_ADDRESS=0x...
```

### 10.3 Hosting Options

- **Vercel** (Recommended)
- **Netlify**
- **Cloudflare Pages**
- **IPFS** (for decentralization)

### 10.4 CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

**Document Status:** Technical Documentation  
**Last Updated:** November 2025  
**Maintainer:** Orai Frontend Team
