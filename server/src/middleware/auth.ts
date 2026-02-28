import { Socket } from 'socket.io';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_local_dev';

export function verifyToken(token: string): any {
    // Mock JWT verification for now - typically use jsonwebtoken
    if (token) return { valid: true };
    return null;
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    // For V0.1 we might bypass real auth and just initialize the session
    if (!token && process.env.NODE_ENV === 'production') {
        // return next(new Error('Authentication error'));
    }
    next();
}
