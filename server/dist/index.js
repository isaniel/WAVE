"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./middleware/auth");
const roomHandlers_1 = require("./socket/roomHandlers");
const privateHandlers_1 = require("./socket/privateHandlers");
const statusHandlers_1 = require("./socket/statusHandlers");
const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
// Express setup
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)({ origin: CLIENT_URL }));
app.use(express_1.default.json());
// Health check endpoint
app.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Campus Chat Engine Server is running',
        timestamp: new Date().toISOString(),
    });
});
// Create HTTP server
const httpServer = (0, http_1.createServer)(app);
// Socket.io setup
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});
exports.io = io;
// Socket.io authentication middleware
io.use(auth_1.authenticateSocket);
// Socket.io connection handler
io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user.fullName} (${user.uid}) - Socket: ${socket.id}`);
    // Register event handlers
    (0, roomHandlers_1.registerRoomHandlers)(io, socket);
    (0, privateHandlers_1.registerPrivateHandlers)(io, socket);
    (0, statusHandlers_1.registerStatusHandlers)(io, socket);
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
//# sourceMappingURL=index.js.map