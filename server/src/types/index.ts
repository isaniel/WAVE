export interface SocketUser {
  uid: string;
  fullName: string;
  email: string;
  role: string;
}

export interface RoomMessageData {
  roomId: string;
  text: string;
}

export interface EditMessageData {
  roomId: string;
  messageId: string;
  text: string;
}

export interface DeleteMessageData {
  roomId: string;
  messageId: string;
}

export interface PrivateMessageData {
  chatId: string;
  recipientId: string;
  text: string;
}

export interface OnlineUser {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  socketId: string;
}
