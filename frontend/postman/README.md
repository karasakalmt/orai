# Orai API Postman Collection

This directory contains the Postman collection for testing the Orai backend API.

## Import Instructions

1. Open Postman
2. Click "Import" button
3. Select `Orai_API_Collection.json`
4. The collection will be imported with all endpoints and examples

## Collection Overview

### Endpoints Included

#### Questions
- **GET /api/questions** - List all questions with pagination
- **GET /api/questions/:id** - Get specific question details

#### Answers
- **GET /api/answers/:id** - Get answer for a question

#### Statistics
- **GET /api/stats** - Platform statistics (cached)

#### Health
- **GET /health** - Service health check

#### Events (Internal)
- **POST /api/events** - Blockchain event webhook (internal use only)

### Environment Variables

The collection uses these variables (already configured):
- `baseUrl`: http://localhost:3000
- `wsUrl`: ws://localhost:3001
- `questionId`: Sample question ID for testing

## Key Features

### No Authentication Required
- The backend is simple and doesn't require JWT or session tokens
- Authentication happens through Web3 wallet signatures on the blockchain
- All read endpoints are public

### WebSocket Support
- Real-time updates via WebSocket at `ws://localhost:3001`
- Events: answer-ready, voting-started, voting-complete
- No authentication needed for public broadcasts

### Automatic Tests
Each request includes:
- Response time validation (<500ms)
- Content-Type checking
- Error response structure validation

## Usage Examples

### 1. Get All Questions
```bash
GET http://localhost:3000/api/questions?limit=20&offset=0&status=all
```

### 2. Get Specific Question
```bash
GET http://localhost:3000/api/questions/0x123456789abcdef
```

### 3. Get Platform Stats
```bash
GET http://localhost:3000/api/stats
```

## Testing Workflow

1. **Start the backend server** (if available)
   ```bash
   cd ../backend
   npm run dev
   ```

2. **Import collection** in Postman

3. **Run requests** to test endpoints

4. **Check responses** match expected format

## Response Examples

### Question List Response
```json
{
  "questions": [...],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

### Question Detail Response
```json
{
  "id": "0x123...",
  "questionText": "...",
  "answer": {
    "text": "...",
    "confidence": 0.95
  }
}
```

## Updates

This collection will be updated as the API evolves. Check for updates when:
- New endpoints are added
- Response formats change
- New query parameters are supported

## Notes

- All timestamps are Unix timestamps (seconds since epoch)
- Question IDs are transaction hashes from blockchain
- Wallet addresses are Ethereum format (0x...)
- ORAI amounts are in token units (not wei)

---

**Last Updated:** November 21, 2024
**API Version:** 1.0.0
**Backend Type:** Simple cache layer (no auth)