import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ErrorRequestHandler, NextFunction, Response, Router } from 'express';
import { expressjwt, Request as JWTRequest } from 'express-jwt';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import logging from './logging';
import { FieldPacket, RowDataPacket } from 'mysql2';
import db from './db';

// private key for hashing passwords/signing JWTs
const secret = fs.readFileSync(process.env.AUTH_KEY_PATH);

// mapping of HTTP/1.1 status codes to phrases
const httpCodes: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    404: 'Not Found',
    500: 'Internal Server Error',
};

// helper functions for sending responses
function sendSuccess(res: Response, payload?: object) {
    res.status(200);
    res.json({
        timestamp: new Date().toISOString(),
        status: 200,
        payload: payload,
    });
}
function sendError(res: Response, status: number, message?: string) {
    res.status(status);
    res.json({
        timestamp: new Date().toISOString(),
        status: status,
        error: httpCodes[status],
        message: message,
    });
}

// configure express-jwt with defaults
const expressJWT = expressjwt({ secret: secret, algorithms: ['HS256'] });

const router = Router();
router.use((err: ErrorRequestHandler, req: JWTRequest, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
        return sendError(res, 401, 'Invalid token');
    } else {
        next(err);
    }
});
router.post('/login', async (req, res) => {
    if (!req.body.username) {
        sendError(res, 400, 'Username not provided');
    } else if (!req.body.password) {
        sendError(res, 400, 'Password not provided');
    } else {
        try {
            const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
                'SELECT * FROM users WHERE username = ? LIMIT 1;',
                [req.body.username]
            );
            if (rows.length) {
                const result = await bcrypt.compare(
                    Buffer.from(
                        crypto.createHmac('sha256', secret).update(req.body.password).digest('hex'),
                        'hex'
                    ).toString('base64'),
                    rows[0].password
                );
                if (result) {
                    return sendSuccess(res, {
                        token: jwt.sign(
                            { uid: rows[0].uid, isAdmin: rows[0].is_admin, canEdit: rows[0].can_edit },
                            secret,
                            { algorithm: 'HS256', expiresIn: '1h' }
                        ),
                    });
                }
            }
            sendError(res, 400, 'Invalid username or password');
        } catch (e) {
            sendError(res, 500);
            logging.error(e);
        }
    }
});
router.post('/createUser', expressJWT, async (req: JWTRequest, res: Response) => {
    if (!req.auth?.isAdmin) {
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (!req.body.username) {
        sendError(res, 400, 'Username not provided');
    } else if (!req.body.password) {
        sendError(res, 400, 'Password not provided');
    } else {
        try {
            const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
                'SELECT 1 FROM users WHERE username = ? LIMIT 1;',
                [req.body.username]
            );
            if (rows.length) {
                return sendError(res, 400, 'User with that username already exists');
            }
            const hashedPassword = await bcrypt.hash(
                Buffer.from(
                    crypto.createHmac('sha256', secret).update(req.body.password).digest('hex'),
                    'hex'
                ).toString('base64'),
                10
            );
            await db.query('INSERT INTO users VALUES (0, ?, ?, ?, ?);', [
                req.body.username,
                hashedPassword,
                req.body.isAdmin ?? 0,
                req.body.canEdit ?? 0,
            ]);
            return sendSuccess(res);
        } catch (e) {
            sendError(res, 500);
            logging.error(e);
        }
    }
});
router.post('/updateUser', expressJWT, async (req: JWTRequest, res: Response) => {
    if (!req.auth?.isAdmin) {
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (!req.body.uid) {
        sendError(res, 400, 'User ID not provided');
    } else {
        try {
            const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
                'SELECT * FROM users WHERE username = ? LIMIT 1;',
                [req.body.username]
            );
            if (!rows.length) {
                return sendError(res, 400, 'User does not exist');
            }
            if (req.body.username) {
                await db.query('UPDATE users SET username = ? WHERE uid = ?;', [req.body.username, req.body.uid]);
            }
            if (req.body.password) {
                const hashedPassword = await bcrypt.hash(
                    Buffer.from(
                        crypto.createHmac('sha256', secret).update(req.body.password).digest('hex'),
                        'hex'
                    ).toString('base64'),
                    10
                );
                await db.query('UPDATE users SET password = ? WHERE uid = ?;', [hashedPassword, req.body.uid]);
            }
            if (req.body.isAdmin) {
                await db.query('UPDATE users SET isAdmin = ? WHERE uid = ?;', [req.body.isAdmin, req.body.uid]);
            }
            if (req.body.canEdit) {
                await db.query('UPDATE users SET canEdit = ? WHERE uid = ?;', [req.body.canEdit, req.body.uid]);
            }
            return sendSuccess(res);
        } catch (e) {
            sendError(res, 500);
            logging.error(e);
        }
    }
});
router.use((req, res) => {
    sendError(res, 404);
});

export default router;
