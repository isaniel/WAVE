import type { Socket, Server } from 'socket.io';
import { db } from '../config/firebase';
import admin from '../config/firebase';
import type { RoomMessageData, EditMessageData, DeleteMessageData } from '../types';

export const registerRoomHandlers = (io: Server, socket: Socket): void => {
  const user = socket.data.user;

  // Join a room
  socket.on('join_room', async (roomId: string, callback?: (success: boolean, error?: string) => void) => {
    try {
      socket.join(roomId);

      // Notify others in the room
      socket.to(roomId).emit('user_joined', {
        roomId,
        user: { uid: user.uid, fullName: user.fullName, role: user.role },
      });

      console.log(`${user.fullName} joined room ${roomId}`);
      callback?.(true);
    } catch (error) {
      console.error('Error joining room:', error);
      callback?.(false, 'Failed to join room');
    }
  });

  // Leave a room
  socket.on('leave_room', (roomId: string) => {
    socket.leave(roomId);

    socket.to(roomId).emit('user_left', {
      roomId,
      user: { uid: user.uid, fullName: user.fullName },
    });

    console.log(`${user.fullName} left room ${roomId}`);
  });

  // Send a message to a room
  socket.on('send_room_message', async (data: RoomMessageData, callback?: (success: boolean, error?: string) => void) => {
    try {
      const { roomId, text } = data;

      // Create message in Firestore
      const messageRef = db.collection('rooms').doc(roomId).collection('messages').doc();
      const now = admin.firestore.Timestamp.now();

      const messageData = {
        senderId: user.uid,
        senderName: user.fullName,
        senderRole: user.role,
        text,
        createdAt: now,
        updatedAt: now,
        edited: false,
        deleted: false,
      };

      await messageRef.set(messageData);

      // Update room's last message
      await db.collection('rooms').doc(roomId).update({
        lastMessage: text,
        lastMessageAt: now,
        updatedAt: now,
      });

      // Broadcast message to all in the room
      io.to(roomId).emit('receive_room_message', {
        roomId,
        message: {
          id: messageRef.id,
          ...messageData,
        },
      });

      callback?.(true);
    } catch (error) {
      console.error('Error sending room message:', error);
      callback?.(false, 'Failed to send message');
    }
  });

  // Edit a room message
  socket.on('edit_room_message', async (data: EditMessageData, callback?: (success: boolean, error?: string) => void) => {
    try {
      const { roomId, messageId, text } = data;

      const messageRef = db.collection('rooms').doc(roomId).collection('messages').doc(messageId);
      const messageDoc = await messageRef.get();

      if (!messageDoc.exists) {
        return callback?.(false, 'Message not found');
      }

      const messageData = messageDoc.data();

      // Only the sender or admin can edit
      if (messageData?.senderId !== user.uid && user.role !== 'admin') {
        return callback?.(false, 'Not authorized to edit this message');
      }

      await messageRef.update({
        text,
        edited: true,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      // Broadcast edit to all in the room
      io.to(roomId).emit('message_edited', { roomId, messageId, text });

      callback?.(true);
    } catch (error) {
      console.error('Error editing message:', error);
      callback?.(false, 'Failed to edit message');
    }
  });

  // Delete a room message
  socket.on('delete_room_message', async (data: DeleteMessageData, callback?: (success: boolean, error?: string) => void) => {
    try {
      const { roomId, messageId } = data;

      const messageRef = db.collection('rooms').doc(roomId).collection('messages').doc(messageId);
      const messageDoc = await messageRef.get();

      if (!messageDoc.exists) {
        return callback?.(false, 'Message not found');
      }

      const messageData = messageDoc.data();

      // Only the sender or admin can delete
      if (messageData?.senderId !== user.uid && user.role !== 'admin') {
        return callback?.(false, 'Not authorized to delete this message');
      }

      await messageRef.update({
        deleted: true,
        text: '[Message deleted]',
        updatedAt: admin.firestore.Timestamp.now(),
      });

      // Broadcast deletion to all in the room
      io.to(roomId).emit('message_deleted', { roomId, messageId });

      callback?.(true);
    } catch (error) {
      console.error('Error deleting message:', error);
      callback?.(false, 'Failed to delete message');
    }
  });

  // Typing indicators
  socket.on('typing_start', (roomId: string) => {
    socket.to(roomId).emit('user_typing', {
      roomId,
      user: { uid: user.uid, fullName: user.fullName },
      isTyping: true,
    });
  });

  socket.on('typing_stop', (roomId: string) => {
    socket.to(roomId).emit('user_typing', {
      roomId,
      user: { uid: user.uid, fullName: user.fullName },
      isTyping: false,
    });
  });
};
