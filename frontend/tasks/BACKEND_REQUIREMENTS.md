# Orai Frontend - Simple Backend Requirements

## Overview
The backend for Orai should be **minimal and simple** - primarily serving as a cache layer and event listener for blockchain data. **No JWT or complex authentication** is needed since all authentication happens through Web3 wallet signatures.

## Architecture Principles

### Keep It Simple
- **No authentication layer** - Web3 wallets handle identity
- **Read-heavy API** - Most data comes from blockchain
- **Event listener** - Listen to smart contract events
- **Cache layer** - Store processed blockchain data
- **No user management** - Users identified by wallet address only

## Minimal API Endpoints

### Public Read-Only Endpoints

#### GET /api/questions
```typescript
// Returns list of questions from blockchain events
{
  questions: [{
    id: "0x123...",
    questionText: "What is...",
    submitter: "0xabc...",
    timestamp: 1234567890,
    status: "pending" | "answered" | "voting" | "verified",
    fee: "10",
    isPriority: false
  }]
}
```

#### GET /api/questions/:id
```typescript
// Returns single question details
{
  id: "0x123...",
  questionText: "What is...",
  submitter: "0xabc...",
  timestamp: 1234567890,
  status: "answered",
  answer: {
    text: "The answer is...",
    confidence: 0.95,
    timestamp: 1234567900
  }
}
```

#### GET /api/stats
```typescript
// Platform statistics (cached, updated hourly)
{
  totalQuestions: 1234,
  totalAnswered: 1000,
  totalVotes: 5000,
  activeVoters: 234,
  averageResponseTime: 45, // seconds
  successRate: 0.95
}
```

### Event Webhook (Called by Backend Job)

#### POST /api/events
```typescript
// Receives blockchain events from listener service
// No external access, internal only
{
  event: "QuestionSubmitted" | "AnswerReady" | "VotingComplete",
  data: { ... }
}
```

## WebSocket for Real-time Updates

### Simple Broadcasting
```typescript
// No authentication needed - broadcasts are public
ws.on('connection', (socket) => {
  // Send public events to all connected clients
  socket.join('public');

  // Broadcast new answers
  eventEmitter.on('answer-ready', (data) => {
    io.to('public').emit('answer-ready', data);
  });
});
```

## Backend Responsibilities

### What the Backend DOES:
1. **Listen to blockchain events** via RPC subscription
2. **Cache question/answer data** to reduce RPC calls
3. **Trigger 0G Compute jobs** when questions are submitted
4. **Broadcast updates** via WebSocket
5. **Calculate statistics** from cached data

### What the Backend DOES NOT DO:
1. ❌ User authentication or sessions
2. ❌ Store user profiles or preferences
3. ❌ Handle payments (all on-chain)
4. ❌ Validate permissions (smart contract handles this)
5. ❌ Complex business logic (keep it in smart contracts)

## Simple Tech Stack

```typescript
// Minimal dependencies
{
  "dependencies": {
    "fastify": "^4.0.0",        // Web server
    "ws": "^8.0.0",              // WebSocket
    "ethers": "^6.0.0",          // Blockchain interaction
    "node-cache": "^5.0.0",      // Simple in-memory cache
    "axios": "^1.0.0"            // HTTP client for 0G Compute
  }
}
```

## Database (Optional)

If persistence is needed, use a simple solution:
- **SQLite** for development/small scale
- **PostgreSQL** for production (single table is enough)

### Simple Schema
```sql
-- Single table to cache blockchain data
CREATE TABLE questions (
  id VARCHAR(66) PRIMARY KEY,  -- Transaction hash
  question_text TEXT,
  submitter VARCHAR(42),        -- Wallet address
  answer_text TEXT,
  answer_confidence DECIMAL,
  status VARCHAR(20),
  created_at TIMESTAMP,
  answered_at TIMESTAMP
);

-- That's it! No user tables, no sessions, no complexity
```

## 0G Compute Integration

### Simple Job Submission
```typescript
async function submitTo0GCompute(question: string, questionId: string) {
  // Simple POST request to 0G Compute API
  const response = await axios.post('https://compute.0g.ai/jobs', {
    model: 'gpt-4',
    prompt: question,
    metadata: { questionId }
  });

  return response.data.jobId;
}
```

## Error Handling

Keep it simple:
```typescript
// Standard error response
{
  error: "Description of what went wrong",
  code: "ERROR_CODE"
}
```

Common errors:
- `BLOCKCHAIN_ERROR` - RPC connection issues
- `COMPUTE_ERROR` - 0G Compute unavailable
- `NOT_FOUND` - Resource doesn't exist

## Deployment

### Simple Deployment
```bash
# Single process, no complex orchestration
node server.js

# Or with PM2 for production
pm2 start server.js
```

### Environment Variables
```env
# Minimal configuration
RPC_URL=https://rpc-testnet.0g.ai
ORACLE_ADDRESS=0x...
COMPUTE_API_KEY=...
PORT=3000
WS_PORT=3001
```

## Monitoring

Keep monitoring simple:
- Health check endpoint: `GET /health`
- Basic logging to console/file
- No complex APM or tracing needed initially

## Summary

The backend should be a **thin layer** that:
1. **Listens** to blockchain events
2. **Caches** data for performance
3. **Triggers** 0G Compute jobs
4. **Broadcasts** updates to frontend

**No authentication, no user management, no complex business logic.**

All the complex logic lives in:
- **Smart contracts** (payments, voting, verification)
- **0G Compute** (AI processing)
- **Frontend** (user interaction, wallet management)

This keeps the backend simple, maintainable, and focused on its core purpose as an event processor and cache layer.

---

**Remember:** If you're adding complexity to the backend, ask yourself - can this be handled by the smart contract or frontend instead? The answer is usually yes!