import type { Socket, Server } from 'socket.io';
import type { OnlineUser } from '../types';

// In-memory store for online users
const onlineUsers = new Map<string, OnlineUser>();

export const registerStatusHandlers = (io: Server, socket: Socket): void => {
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
  socket.on('get_online_users', (callback: (users: Omit<OnlineUser, 'socketId'>[]) => void) => {
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
