import type { Socket } from 'socket.io';
export interface SocketUser {
    uid: string;
    fullName: string;
    email: string;
    role: string;
}
declare module 'socket.io' {
    interface Socket {
        data: {
            user: SocketUser;
        };
    }
}
export declare const authenticateSocket: (socket: Socket, next: (err?: Error) => void) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map