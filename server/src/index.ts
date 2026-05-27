import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { authenticateSocket } from './middleware/auth';
import { registerRoomHandlers } from './socket/roomHandlers';
import { registerPrivateHandlers } from './socket/privateHandlers';
import { registerStatusHandlers } from './socket/statusHandlers';

const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Express setup
const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Health check endpoint
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Campus Chat Engine Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Socket.io authentication middleware
io.use(authenticateSocket);

// Socket.io connection handler
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`User connected: ${user.fullName} (${user.uid}) - Socket: ${socket.id}`);

  // Register event handlers
  registerRoomHandlers(io, socket);
  registerPrivateHandlers(io, socket);
  registerStatusHandlers(io, socket);

  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${user.fullName} (${user.uid}) - Reason: ${reason}`);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Campus Chat Engine Server is running`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Client URL: ${CLIENT_URL}`);
  console.log(`   Health check: http://localhost:${PORT}/\n`);
});

export { io, app };
