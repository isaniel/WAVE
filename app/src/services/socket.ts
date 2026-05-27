import { io, Socket } from 'socket.io-client';
import type { RoomMessage, PrivateMessage } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): void {
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Room Events
  joinRoom(roomId: string, callback?: (success: boolean, error?: string) => void): void {
    this.socket?.emit('join_room', roomId, callback);
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit('leave_room', roomId);
  }

  sendRoomMessage(
    roomId: string,
    text: string,
    callback?: (success: boolean, error?: string) => void
  ): void {
    this.socket?.emit('send_room_message', { roomId, text }, callback);
  }

  onRoomMessage(callback: (data: { roomId: string; message: RoomMessage }) => void): void {
    this.socket?.on('receive_room_message', callback);
  }

  offRoomMessage(): void {
    this.socket?.off('receive_room_message');
  }

  startTyping(roomId: string): void {
    this.socket?.emit('typing_start', roomId);
  }

  stopTyping(roomId: string): void {
    this.socket?.emit('typing_stop', roomId);
  }

  onUserTyping(callback: (data: { roomId: string; user: { uid: string; fullName: string }; isTyping: boolean }) => void): void {
    this.socket?.on('user_typing', callback);
  }

  offUserTyping(): void {
    this.socket?.off('user_typing');
  }

  onUserJoined(callback: (data: { roomId: string; user: { uid: string; fullName: string; role: string } }) => void): void {
    this.socket?.on('user_joined', callback);
  }

  onUserLeft(callback: (data: { roomId: string; user: { uid: string; fullName: string } }) => void): void {
    this.socket?.on('user_left', callback);
  }

  editRoomMessage(
    roomId: string,
    messageId: string,
    text: string,
    callback?: (success: boolean, error?: string) => void
  ): void {
    this.socket?.emit('edit_room_message', { roomId, messageId, text }, callback);
  }

  onMessageEdited(callback: (data: { roomId: string; messageId: string; text: string }) => void): void {
    this.socket?.on('message_edited', callback);
  }

  offMessageEdited(): void {
    this.socket?.off('message_edited');
  }

  deleteRoomMessage(
    roomId: string,
    messageId: string,
    callback?: (success: boolean, error?: string) => void
  ): void {
    this.socket?.emit('delete_room_message', { roomId, messageId }, callback);
  }

  onMessageDeleted(callback: (data: { roomId: string; messageId: string }) => void): void {
    this.socket?.on('message_deleted', callback);
  }

  offMessageDeleted(): void {
    this.socket?.off('message_deleted');
  }

  // Private Message Events
  joinPrivateChat(chatId: string, callback?: (success: boolean, error?: string) => void): void {
    this.socket?.emit('join_private_chat', chatId, callback);
  }

  leavePrivateChat(chatId: string): void {
    this.socket?.emit('leave_private_chat', chatId);
  }

  sendPrivateMessage(
    chatId: string,
    recipientId: string,
    text: string,
    callback?: (success: boolean, error?: string) => void
  ): void {
    this.socket?.emit('send_private_message', { chatId, recipientId, text }, callback);
  }

  onPrivateMessage(callback: (data: { chatId: string; message: PrivateMessage }) => void): void {
    this.socket?.on('receive_private_message', callback);
  }

  offPrivateMessage(): void {
    this.socket?.off('receive_private_message');
  }

  onPrivateMessageDeleted(callback: (data: { chatId: string; messageId: string }) => void): void {
    this.socket?.on('private_message_deleted', callback);
  }

  offPrivateMessageDeleted(): void {
    this.socket?.off('private_message_deleted');
  }

  // Online/Offline Status
  onUserOnline(callback: (data: { uid: string; fullName: string }) => void): void {
    this.socket?.on('user_online', callback);
  }

  onUserOffline(callback: (data: { uid: string; fullName: string }) => void): void {
    this.socket?.on('user_offline', callback);
  }

  getOnlineUsers(callback: (users: { uid: string; fullName: string; email: string; role: string }[]) => void): void {
    this.socket?.emit('get_online_users', callback);
  }
}

export const socketService = new SocketService();
export default socketService;
