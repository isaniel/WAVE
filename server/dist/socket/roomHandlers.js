"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoomHandlers = void 0;
const firebase_1 = require("../config/firebase");
const firebase_2 = __importDefault(require("../config/firebase"));
const registerRoomHandlers = (io, socket) => {
    const user = socket.data.user;
    // Join a room
    socket.on('join_room', async (roomId, callback) => {
        try {
            socket.join(roomId);
            // Notify others in the room
            socket.to(roomId).emit('user_joined', {
                roomId,
                user: { uid: user.uid, fullName: user.fullName, role: user.role },
            });
            console.log(`${user.fullName} joined room ${roomId}`);
            callback?.(true);
        }
        catch (error) {
            console.error('Error joining room:', error);
            callback?.(false, 'Failed to join room');
        }
    });
    // Leave a room
    socket.on('leave_room', (roomId) => {
        socket.leave(roomId);
        socket.to(roomId).emit('user_left', {
            roomId,
            user: { uid: user.uid, fullName: user.fullName },
        });
        console.log(`${user.fullName} left room ${roomId}`);
    });
    // Send a message to a room
    socket.on('send_room_message', async (data, callback) => {
        try {
            const { roomId, text } = data;
            // Create message in Firestore
            const messageRef = firebase_1.db.collection('rooms').doc(roomId).collection('messages').doc();
            const now = firebase_2.default.firestore.Timestamp.now();
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
            await firebase_1.db.collection('rooms').doc(roomId).update({
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
        }
        catch (error) {
            console.error('Error sending room message:', error);
            callback?.(false, 'Failed to send message');
        }
    });
    // Edit a room message
    socket.on('edit_room_message', async (data, callback) => {
        try {
            const { roomId, messageId, text } = data;
            const messageRef = firebase_1.db.collection('rooms').doc(roomId).collection('messages').doc(messageId);
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
                updatedAt: firebase_2.default.firestore.Timestamp.now(),
            });
            // Broadcast edit to all in the room
            io.to(roomId).emit('message_edited', { roomId, messageId, text });
            callback?.(true);
        }
        catch (error) {
            console.error('Error editing message:', error);
            callback?.(false, 'Failed to edit message');
        }
    });
    // Delete a room message
    socket.on('delete_room_message', async (data, callback) => {
        try {
            const { roomId, messageId } = data;
            const messageRef = firebase_1.db.collection('rooms').doc(roomId).collection('messages').doc(messageId);
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
                updatedAt: firebase_2.default.firestore.Timestamp.now(),
            });
            // Broadcast deletion to all in the room
            io.to(roomId).emit('message_deleted', { roomId, messageId });
            callback?.(true);
        }
        catch (error) {
            console.error('Error deleting message:', error);
            callback?.(false, 'Failed to delete message');
        }
    });
    // Typing indicators
    socket.on('typing_start', (roomId) => {
        socket.to(roomId).emit('user_typing', {
            roomId,
            user: { uid: user.uid, fullName: user.fullName },
            isTyping: true,
        });
    });
    socket.on('typing_stop', (roomId) => {
        socket.to(roomId).emit('user_typing', {
            roomId,
            user: { uid: user.uid, fullName: user.fullName },
            isTyping: false,
        });
    });
};
exports.registerRoomHandlers = registerRoomHandlers;
//# sourceMappingURL=roomHandlers.js.map