"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStatusHandlers = void 0;
// In-memory store for online users
const onlineUsers = new Map();
const registerStatusHandlers = (io, socket) => {
    const user = socket.data.user;
    // Add user to online list
    onlineUsers.set(user.uid, {
        uid: user.uid,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        socketId: socket.id,
    });
    // Broadcast to all that this user is online
    socket.broadcast.emit('user_online', {
        uid: user.uid,
        fullName: user.fullName,
    });
    console.log(`${user.fullName} is now online (${onlineUsers.size} users online)`);
    // Get online users list
    socket.on('get_online_users', (callback) => {
        const users = Array.from(onlineUsers.values()).map(({ socketId, ...rest }) => rest);
        callback(users);
    });
    // Handle disconnect
    socket.on('disconnect', () => {
        onlineUsers.delete(user.uid);
        // Broadcast to all that this user went offline
        socket.broadcast.emit('user_offline', {
            uid: user.uid,
            fullName: user.fullName,
        });
        console.log(`${user.fullName} went offline (${onlineUsers.size} users online)`);
    });
};
exports.registerStatusHandlers = registerStatusHandlers;
//# sourceMappingURL=statusHandlers.js.map