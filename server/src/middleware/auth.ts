import type { Socket } from 'socket.io';
import { authAdmin, db } from '../config/firebase';

export interface SocketUser {
  uid: string;
  fullName: string;
  email: string;
  role: string;
}

// Extend Socket.data to include user info
declare module 'socket.io' {
  interface Socket {
    data: {
      user: SocketUser;
    };
  }
}

export const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decodedToken = await authAdmin.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Fetch user record to check status
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return next(new Error('Authentication error: User not found'));
    }

    const userData = userDoc.data();
    if (!userData || !userData.isActive) {
      return next(new Error('Authentication error: Account deactivated or invalid'));
    }

    // Attach user data to socket
    socket.data.user = {
      uid,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role,
    };

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};
