import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';

// Import routes
import questionsRouter from './routes/questions';
import validationsRouter from './routes/validations';
import oracleRouter from './routes/oracle';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/questions', questionsRouter);
app.use('/api/validations', validationsRouter);
app.use('/api/oracle', oracleRouter);

// WebSocket handling
io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected:', socket.id);
  });

  // Subscribe to question updates
  socket.on('subscribe:questions', () => {
    socket.join('questions');
  });

  // Subscribe to validation updates
  socket.on('subscribe:validations', () => {
    socket.join('validations');
  });
});

// Export io for use in other modules
export { io };

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      details: err.details || {}
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✨ Server running on http://localhost:${PORT}`);
  console.log(`📦 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server ready`);
});
