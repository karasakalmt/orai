# Orai Frontend - Quick Reference Guide

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linter
npm run lint

# Format code
npm run format
```

## 🔗 Important Links

### Development
- Local Frontend: http://localhost:5173
- Local Backend API: http://localhost:3000 (Simple REST API)
- 0G Testnet RPC: https://rpc-testnet.0g.ai
- 0G Testnet Explorer: https://explorer-testnet.0g.ai

### Documentation
- [0G Documentation](https://docs.0g.ai)
- [RainbowKit Docs](https://www.rainbowkit.com/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [TailwindCSS](https://tailwindcss.com/docs)

### Resources
- [0G Testnet Faucet](https://faucet-testnet.0g.ai)
- [WalletConnect Project](https://cloud.walletconnect.com)

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── assets/          # Images, fonts, static files
│   ├── components/      # Reusable components
│   │   ├── ui/         # Base UI components
│   │   ├── oracle/     # Oracle-specific components
│   │   ├── wallet/     # Web3 components
│   │   └── layout/     # Layout components
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and contracts
│   ├── store/          # State management (Zustand)
│   ├── types/          # TypeScript types
│   └── styles/         # Global CSS
├── public/             # Static public files
└── tasks/             # Development tasks and docs
```

## 💡 Common Code Snippets

### Connect to Wallet
```typescript
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletConnect() {
  return <ConnectButton />;
}
```

### Use Account Info
```typescript
import { useAccount } from 'wagmi';

export function Component() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return <div>Please connect wallet</div>;
  }

  return <div>Connected: {address}</div>;
}
```

### Submit Question to Oracle
```typescript
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import OracleABI from '@/lib/contracts/OracleContract';
import { ORACLE_ADDRESS } from '@/lib/contracts/addresses';

const { config } = usePrepareContractWrite({
  address: ORACLE_ADDRESS,
  abi: OracleABI,
  functionName: 'submitQuestion',
  args: [questionText, referenceUrls, isPriority],
  value: parseEther(feeAmount),
});

const { write } = useContractWrite(config);
```

### Read Contract Data
```typescript
import { useContractRead } from 'wagmi';

const { data: answer } = useContractRead({
  address: ORACLE_ADDRESS,
  abi: OracleABI,
  functionName: 'getAnswer',
  args: [questionId],
});
```

### Create Zustand Store
```typescript
import { create } from 'zustand';

interface StoreState {
  count: number;
  increment: () => void;
}

export const useStore = create<StoreState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### Use React Query (Simple Backend)
```typescript
import { useQuery } from '@tanstack/react-query';

// No auth headers needed - backend is simple read-only API
// Authentication happens through Web3 wallet signatures
export function useQuestions() {
  return useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const res = await fetch('/api/questions');
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });
}
```

### WebSocket Connection
```typescript
useEffect(() => {
  const ws = new WebSocket(WS_URL);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleMessage(data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return () => ws.close();
}, []);
```

## 🎨 Component Templates

### Basic Component
```typescript
import { FC } from 'react';
import { clsx } from 'clsx';

interface ComponentProps {
  className?: string;
  children: React.ReactNode;
}

export const Component: FC<ComponentProps> = ({
  className,
  children
}) => {
  return (
    <div className={clsx('base-styles', className)}>
      {children}
    </div>
  );
};
```

### Form with Validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  question: z.string().min(10).max(500),
});

type FormData = z.infer<typeof schema>;

export function QuestionForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    // Submit logic
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('question')} />
      {errors.question && <span>{errors.question.message}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

## 🔧 Environment Variables

```bash
# Required
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_CHAIN_ID=16600
VITE_ORACLE_ADDRESS=0x...
VITE_TOKEN_ADDRESS=0x...

# Optional
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_ANALYTICS_ID=analytics_id
```

## 📝 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature

# Create pull request on GitHub
```

### Commit Message Format
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/config changes

## 🐛 Common Issues & Solutions

### Issue: Wallet won't connect
```bash
# Check network configuration
# Ensure RPC URL is correct
# Try different wallet or browser
```

### Issue: Transaction fails
```bash
# Check ORAI token balance
# Verify gas settings
# Check contract address
```

### Issue: Build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

### Issue: Type errors
```bash
# Generate types from contracts
npm run generate-types

# Check TypeScript config
npm run type-check
```

## 📊 Testing Commands

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run test coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🚀 Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables set
- [ ] Build successful
- [ ] Bundle size acceptable (<500KB)
- [ ] Performance audit passed
- [ ] Security headers configured
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Documentation updated

## 📱 Responsive Breakpoints

```css
/* TailwindCSS defaults */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

## 🔐 Security Best Practices

1. Always validate user input
2. Use environment variables for sensitive data
3. Implement rate limiting
4. Add transaction confirmation modals
5. Validate contract addresses
6. Check for reentrancy in UI flows
7. Sanitize displayed data
8. Use HTTPS in production
9. Implement CSP headers
10. Regular dependency updates

---

**Quick Help:**
- Slack: #orai-frontend
- Wiki: [Internal Wiki](internal-link)
- Issues: [GitHub Issues](github-link)