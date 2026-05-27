"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPrivateHandlers = void 0;
const firebase_1 = require("../config/firebase");
const firebase_2 = __importDefault(require("../config/firebase"));
const registerPrivateHandlers = (io, socket) => {
    const user = socket.data.user;
    // Join a private chat room
    socket.on('join_private_chat', (chatId, callback) => {
        try {
            socket.join(`private:${chatId}`);
            console.log(`${user.fullName} joined private chat ${chatId}`);
            callback?.(true);
        }
        catch (error) {
            console.error('Error joining private chat:', error);
            callback?.(false, 'Failed to join private chat');
        }
    });
    // Leave a private chat room
    socket.on('leave_private_chat', (chatId) => {
        socket.leave(`private:${chatId}`);
        console.log(`${user.fullName} left private chat ${chatId}`);
    });
    // Send a private message
    socket.on('send_private_message', async (data, callback) => {
        try {
            const { chatId, text } = data;
            // Create message in Firestore
            const messageRef = firebase_1.db.collection('privateChats').doc(chatId).collection('messages').doc();
            const now = firebase_2.default.firestore.Timestamp.now();
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
            await firebase_1.db.collection('privateChats').doc(chatId).update({
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
        }
        catch (error) {
            console.error('Error sending private message:', error);
            callback?.(false, 'Failed to send message');
        }
    });
};
exports.registerPrivateHandlers = registerPrivateHandlers;
//# sourceMappingURL=privateHandlers.js.map