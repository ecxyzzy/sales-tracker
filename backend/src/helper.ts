import crypto from 'crypto';
import { Response } from 'express';

// mapping of HTTP/1.1 status codes to phrases
const httpCodes: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    404: 'Not Found',
    500: 'Internal Server Error',
};

// helper function for sending success (200 OK) responses
export function sendSuccess(res: Response, payload?: object) {
    res.status(200);
    res.json({
        timestamp: new Date().toISOString(),
        status: 200,
        payload: payload,
    });
}

// helper function for sending error (4xx/5xx) responses
export function sendError(res: Response, status: number, message?: string) {
    res.status(status);
    res.json({
        timestamp: new Date().toISOString(),
        status: status,
        error: httpCodes[status],
        message: message,
    });
}

// helper function for pre-hashing a password
export async function preHashPassword(secret: string, password: string) {
    return Buffer.from(crypto.createHmac('sha256', secret).update(password).digest('hex'), 'hex').toString('base64');
}
