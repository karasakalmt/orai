# Orai Frontend

Decentralized AI Oracle frontend built with React, TypeScript, and Vite.

## 🚀 Quick Start

### Prerequisites
- Node.js v22+ (use `nvm use 22`)
- npm v11+

### Installation
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

## 📁 Project Structure

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
│   │   ├── contracts/  # Smart contract ABIs
│   │   ├── api/        # API client
│   │   └── utils/      # Helper functions
│   ├── store/          # State management (Zustand)
│   ├── types/          # TypeScript types
│   └── styles/         # Global CSS
├── postman/            # API testing collection
├── tasks/              # Development tasks and documentation
└── public/             # Static public files
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run type-check   # TypeScript type checking
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

## 🔧 Technology Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Web3:** RainbowKit + Wagmi (coming soon)
- **State:** Zustand + React Query (coming soon)
- **Forms:** React Hook Form + Zod (coming soon)

## 🌐 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Backend API
VITE_API_URL=http://localhost:3000

# WebSocket
VITE_WS_URL=ws://localhost:3001

# 0G Network
VITE_CHAIN_ID=16600
VITE_RPC_URL=https://rpc-testnet.0g.ai

# Smart Contracts (update after deployment)
VITE_ORACLE_ADDRESS=0x...
VITE_TOKEN_ADDRESS=0x...

# Optional
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 📝 API Testing

The `postman/` directory contains a Postman collection for testing the backend API:

1. Import `postman/Orai_API_Collection.json` into Postman
2. The collection includes all API endpoints with examples
3. No authentication needed - the backend is simple

## 📚 Documentation

- **Development Tasks:** See `tasks/` directory
- **Architecture:** See `CLAUDE.md`
- **Frontend Details:** See `FRONTEND.md`
- **Backend Requirements:** See `tasks/BACKEND_REQUIREMENTS.md`

## 🚧 Current Status

✅ **Completed:**
- Project initialization with Vite + React + TypeScript
- TailwindCSS configuration
- Basic project structure
- Environment configuration
- Postman API collection
- Development server setup

🔄 **In Progress:**
- Web3 integration (RainbowKit + Wagmi)
- Component library
- Page implementations

📋 **Upcoming:**
- Smart contract integration
- State management
- Real-time WebSocket
- Testing setup

## 🤝 Contributing

1. Check `tasks/TODO.md` for available tasks
2. Follow the code style in `.eslintrc` and `.prettierrc`
3. Write tests for new features
4. Update documentation as needed

## 📄 License

ISC

---

**Project:** Orai - Decentralized AI Oracle on 0G Network
**Last Updated:** November 21, 2024