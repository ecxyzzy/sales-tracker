import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Response, Router } from 'express';
import { expressjwt, Request as JWTRequest } from 'express-jwt';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { FieldPacket, RowDataPacket } from 'mysql2';
import db from './db';
import { sendSuccess, sendError } from './helper';
import logger from './logger';

// private key for hashing passwords/signing JWTs
const secret = fs.readFileSync(process.env.AUTH_KEY_PATH);

// configure express-jwt with defaults
const expressJWT = expressjwt({ secret: secret, algorithms: ['HS256'] });

// router configuration
const router = Router();

// login endpoint
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
                    logger.info(`User with UID ${rows[0].uid} logged in successfully`);
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
            logger.info(`Login attempt (${req.body.username} / ${req.body.password}) from ${req.ip} failed`);
        } catch (e) {
            sendError(res, 500);
            logger.error(e);
        }
    }
});

// CRUD endpoints for users
router.post('/createUser', expressJWT, async (req: JWTRequest, res: Response) => {
    if (!req.auth?.isAdmin) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /createUser without sufficient permissions`);
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (!req.body.username) {
        sendError(res, 400, 'Username not provided');
    } else if (!req.body.password) {
        sendError(res, 400, 'Password not provided');
    } else {
        try {
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
            logger.info(`User with UID ${req.auth?.uid} created new user with username ${req.body.username}`);
            return sendSuccess(res);
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') {
                return sendError(res, 400, 'User with that username already exists');
            }
            sendError(res, 500);
            logger.error(e);
        }
    }
});
router.get('/getUsers', expressJWT, async (req: JWTRequest, res: Response) => {
    try {
        const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
            'SELECT uid, username, is_admin, can_edit FROM users;'
        );
        logger.info(`User with UID ${req.auth?.uid} requested info on all users`);
        return sendSuccess(res, rows);
    } catch (e) {
        sendError(res, 500);
        logger.error(e);
    }
});
router.post('/updateUser', expressJWT, async (req: JWTRequest, res: Response) => {
    if (!req.auth?.isAdmin) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /updateUser without sufficient permissions`);
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (!req.body.uid) {
        sendError(res, 400, 'User ID not provided');
    } else {
        try {
            const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
                'SELECT * FROM users WHERE uid = ? LIMIT 1;',
                [req.body.uid]
            );
            if (!rows.length) {
                return sendError(res, 400, 'User does not exist');
            }
            if (req.body.username) {
                await db.query('UPDATE users SET username = ? WHERE uid = ?;', [req.body.username, req.body.uid]);
                logger.info(
                    `User with UID ${req.auth?.uid} renamed user with UID ${req.body.uid} (${rows[0].username} => ${req.body.username}`
                );
                req.body.username = rows[0].username;
            }
            if (req.body.password) {
                const hashedPassword = await bcrypt.hash(
                    Buffer.from(
                        crypto.createHmac('sha256', secret).update(req.body.password).digest('hex'),
                        'hex'
                    ).toString('base64'),
                    10
                );
                await db.query('UPDATE users SET hashed_password = ? WHERE uid = ?;', [hashedPassword, req.body.uid]);
                logger.info(
                    `User with UID ${req.auth?.uid} changed password for user ${req.body.username} with UID ${req.body.uid}`
                );
            }
            if (req.body.isAdmin != rows[0].is_admin) {
                await db.query('UPDATE users SET is_admin = ? WHERE uid = ?;', [req.body.isAdmin, req.body.uid]);
                logger.info(
                    `User with UID ${req.auth?.uid} ${
                        !rows[0].is_admin && req.body.isAdmin ? 'granted' : 'revoked'
                    } administrator privileges for user ${req.body.username} with UID ${req.body.uid}`
                );
            }
            if (req.body.canEdit != rows[0].can_edit) {
                await db.query('UPDATE users SET can_edit = ? WHERE uid = ?;', [req.body.canEdit, req.body.uid]);
                logger.info(
                    `User with UID ${req.auth?.uid} ${
                        !rows[0].can_edit && req.body.canEdit ? 'granted' : 'revoked'
                    } handler privileges for user ${req.body.username} with UID ${req.body.uid}`
                );
            }
            return sendSuccess(res);
        } catch (e) {
            sendError(res, 500);
            logger.error(e);
        }
    }
});
router.post('/deleteUser', expressJWT, async (req: JWTRequest, res: Response) => {
    if (!req.auth?.isAdmin) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /deleteUser without sufficient permissions`);
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (!req.body.uid) {
        sendError(res, 400, 'User ID not provided');
    } else {
        try {
            const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
                'SELECT * FROM users WHERE uid = ? LIMIT 1;',
                [req.body.uid]
            );
            if (!rows.length) {
                return sendError(res, 400, 'User does not exist');
            }
            await db.query('DELETE FROM users WHERE uid = ?', [req.body.uid]);
            logger.info(`User with UID ${req.auth?.uid} deleted user ${rows[0].username} with UID ${req.body.uid}`);
            return sendSuccess(res);
        } catch (e) {
            sendError(res, 500);
            logger.error(e);
        }
    }
});

// CRUD endpoints for products
router.post('/createProduct', expressJWT, async (req: JWTRequest, res: Response) => {
    if (!(req.auth?.isAdmin || req.auth?.canEdit)) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /createProduct without sufficient permissions`);
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (!req.body.productName) {
        sendError(res, 400, 'Product name not provided');
    } else {
        try {
            await db.query('INSERT INTO products VALUES (0, ?);', [req.body.productName]);
            logger.info(`User with UID ${req.auth?.uid} created new product named ${req.body.productName}`);
            return sendSuccess(res);
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') {
                return sendError(res, 400, 'Product with that name already exists');
            }
            sendError(res, 500);
            logger.error(e);
        }
    }
});
router.get('/getProducts', expressJWT, async (req: JWTRequest, res: Response) => {
    try {
        const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query('SELECT pid, p_name FROM products;');
        logger.info(`User with UID ${req.auth?.uid} requested info on all products`);
        return sendSuccess(res, rows);
    } catch (e) {
        sendError(res, 500);
        logger.error(e);
    }
});
router.post('/updateProduct', expressJWT, async (req: JWTRequest, res: Response) => {
    if (!(req.auth?.isAdmin || req.auth?.canEdit)) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /updateProduct without sufficient permissions`);
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (!req.body.pid) {
        sendError(res, 400, 'Product ID not provided');
    } else {
        try {
            const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
                'SELECT * FROM users WHERE uid = ? LIMIT 1;',
                [req.body.uid]
            );
            if (!rows.length) {
                return sendError(res, 400, 'Product does not exist');
            }
            if (req.body.productName) {
                await db.query('UPDATE products SET p_name = ? WHERE pid = ?;', [req.body.productName, req.body.pid]);
                logger.info(
                    `User with UID ${req.auth?.uid} renamed product with PID ${req.body.pid} (${rows[0].p_name} => ${req.body.productName})`
                );
            }
            return sendSuccess(res);
        } catch (e) {
            sendError(res, 500);
            logger.error(e);
        }
    }
});
router.post('/deleteProduct', expressJWT, async (req: JWTRequest, res: Response) => {
    if (!(req.auth?.isAdmin || req.auth?.canEdit)) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /deleteProduct without sufficient permissions`);
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (!req.body.pid) {
        sendError(res, 400, 'Product ID not provided');
    } else {
        try {
            const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
                'SELECT * FROM products WHERE pid = ? LIMIT 1;',
                [req.body.pid]
            );
            if (!rows.length) {
                return sendError(res, 400, 'Product does not exist');
            }
            await db.query('DELETE FROM users WHERE uid = ?', [req.body.uid]);
            logger.info(`User with UID ${req.auth?.uid} deleted product ${rows[0].p_name} with PID ${req.body.uid}`);
            return sendSuccess(res);
        } catch (e) {
            sendError(res, 500);
            logger.error(e);
        }
    }
});

router.use((req, res) => {
    sendError(res, 404);
});

export default router;
