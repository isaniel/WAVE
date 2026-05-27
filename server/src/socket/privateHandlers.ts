import type { Socket, Server } from 'socket.io';
import { db } from '../config/firebase';
import admin from '../config/firebase';
import type { PrivateMessageData } from '../types';

export const registerPrivateHandlers = (io: Server, socket: Socket): void => {
  const user = socket.data.user;

  // Join a private chat room
  socket.on('join_private_chat', (chatId: string, callback?: (success: boolean, error?: string) => void) => {
    try {
      socket.join(`private:${chatId}`);
      console.log(`${user.fullName} joined private chat ${chatId}`);
      callback?.(true);
    } catch (error) {
      console.error('Error joining private chat:', error);
      callback?.(false, 'Failed to join private chat');
    }
  });

  // Leave a private chat room
  socket.on('leave_private_chat', (chatId: string) => {
    socket.leave(`private:${chatId}`);
    console.log(`${user.fullName} left private chat ${chatId}`);
  });

  // Send a private message
  socket.on('send_private_message', async (data: PrivateMessageData, callback?: (success: boolean, error?: string) => void) => {
    try {
      const { chatId, text } = data;

      // Create message in Firestore
      const messageRef = db.collection('privateChats').doc(chatId).collection('messages').doc();
      const now = admin.firestore.Timestamp.now();

      const messageData = {
        senderId: user.uid,
        senderName: user.fullName,
        text,
        createdAt: now,
        updatedAt: now,
        deleted: false,
      };

      await messageRef.set(messageData);

      // Update chat's last message
      await db.collection('privateChats').doc(chatId).update({
        lastMessage: text,
        lastMessageAt: now,
        updatedAt: now,
      });

      // Broadcast message to the private chat room
      io.to(`private:${chatId}`).emit('receive_private_message', {
        chatId,
        message: {
          id: messageRef.id,
          ...messageData,
        },
      });

      callback?.(true);
    } catch (error) {
      console.error('Error sending private message:', error);
      callback?.(false, 'Failed to send message');
    }
  });
};
