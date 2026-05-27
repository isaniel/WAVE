"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSocket = void 0;
const firebase_1 = require("../config/firebase");
const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        // Verify token
        const decodedToken = await firebase_1.authAdmin.verifyIdToken(token);
        const uid = decodedToken.uid;
        // Fetch user record to check status
        const userDoc = await firebase_1.db.collection('users').doc(uid).get();
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
    }
    catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
    }
};
exports.authenticateSocket = authenticateSocket;
//# sourceMappingURL=auth.js.map