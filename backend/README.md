# Orai Backend

Decentralized AI-verified oracle backend built on 0G infrastructure.

## 🚀 Quick Start

### Prerequisites
- Node.js v22+ (use `nvm use 22`)
- PostgreSQL 15
- Redis 7

### Installation
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations (requires PostgreSQL running)
npm run prisma:migrate
```

### Development
```bash
# Start development server with hot reload
npm run dev

# Server will be available at:
# - Health check: http://localhost:3001/health
# - API info: http://localhost:3001/api
```

## 📂 Project Structure
```
src/
├── config/       # Configuration files
├── controllers/  # Request handlers
├── services/     # Business logic
├── repositories/ # Database access layer
├── routes/       # API route definitions
├── middleware/   # Custom middleware
├── schemas/      # Validation schemas (Zod)
├── workers/      # Background job processors
├── types/        # TypeScript type definitions
├── utils/        # Utility functions
├── contracts/    # Smart contract ABIs
├── app.ts        # Fastify app setup
└── server.ts     # Entry point
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm test` | Run tests with Vitest |
| `npm run lint` | Run ESLint |
| `npm run format` | Check code formatting |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |

## 📡 API Endpoints

### Currently Implemented
- `GET /health` - Health check
- `GET /api` - API information

### Planned Endpoints
- `POST /api/questions` - Submit oracle question
- `GET /api/questions/:id` - Get question details
- `GET /api/questions` - List questions
- `GET /api/answers/:questionId` - Get answer
- `POST /api/votes` - Cast vote
- `GET /api/votes/:questionId` - Get voting info
- `GET /api/user/:address` - Get user profile

## 📚 API Documentation

Import the Postman collection from `postman_collection.json` for full API documentation and testing.

## 🔐 Environment Variables

See `.env.example` for required environment variables:
- Database configuration
- Redis configuration
- 0G service API keys
- JWT secrets
- Blockchain RPC URLs

## 🏗️ Current Status

### ✅ Completed
- Project initialization with TypeScript
- Fastify server with core plugins (CORS, Helmet, Rate Limiting, JWT, WebSocket)
- Prisma ORM setup with schema
- Logger configuration
- Basic project structure
- Health check and API info endpoints
- Postman collection

### 🚧 In Progress
- PostgreSQL database setup
- Core service implementations
- API endpoint development

### 📋 TODO
- 0G Compute service integration
- 0G Storage service integration
- Blockchain service for smart contracts
- Question submission endpoint
- Voting system implementation
- Background workers with BullMQ
- Comprehensive test suite

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## 🐳 Docker Support

Docker configuration coming soon for easier deployment.

## 📄 License

MIT

## 👥 Team

Orai Team

---

For detailed technical specifications, see [BACKEND.md](../BACKEND.md)
For product requirements, see [PRD.md](../../PRD.md)