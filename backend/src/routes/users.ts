import bcrypt from 'bcrypt';
import { Response, Router } from 'express';
import { expressjwt, Request as JWTRequest } from 'express-jwt';
import { FieldPacket, RowDataPacket } from 'mysql2';
import db from '../db';
import { preHashPassword, sendError, sendSuccess } from '../helper';
import logger from '../logger';
import { authKey } from '../secrets';

const router = Router();
router.use(expressjwt({ secret: authKey, algorithms: ['HS256'] }));
router.post('/createUser', async (req: JWTRequest, res: Response) => {
    if (!req.auth?.isAdmin) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /createUser without sufficient permissions`);
        return sendError(res, 403, 'Insufficient permissions');
    }
    if (!req.body.username) {
        sendError(res, 400, 'Username not provided');
    } else if (!req.body.password) {
        sendError(res, 400, 'Password not provided');
    } else {
        try {
            const hashedPassword = await bcrypt.hash(await preHashPassword(authKey, req.body.password), 10);
            await db.query('INSERT INTO users VALUES (DEFAULT, ?, ?, ?, ?);', [
                req.body.username,
                hashedPassword,
                req.body.isAdmin ?? 0,
                req.body.isHandler ?? 0,
            ]);
            logger.info(`User with UID ${req.auth?.uid} created new user with username ${req.body.username}`);
            return sendSuccess(res);
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') {
                return sendError(res, 404, 'User with that username already exists');
            }
            sendError(res, 500);
            logger.error(e);
        }
    }
});
router.get('/getUsers', async (req: JWTRequest, res: Response) => {
    try {
        const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
            'SELECT uid, username, isAdmin, isHandler FROM users;'
        );
        logger.info(`User with UID ${req.auth?.uid} requested info on all users`);
        return sendSuccess(res, rows);
    } catch (e) {
        sendError(res, 500);
        logger.error(e);
    }
});
router.post('/updateUser', async (req: JWTRequest, res: Response) => {
    if (!req.auth?.isAdmin) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /updateUser without sufficient permissions`);
        return sendError(res, 403, 'Insufficient permissions');
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
                return sendError(res, 404, 'User does not exist');
            }
            if (req.body.username) {
                await db.query('UPDATE users SET username = ? WHERE uid = ?;', [req.body.username, req.body.uid]);
                logger.info(
                    `User with UID ${req.auth?.uid} renamed user with UID ${req.body.uid} (${rows[0].username} => ${req.body.username}`
                );
                req.body.username = rows[0].username;
            }
            if (req.body.password) {
                const hashedPassword = await bcrypt.hash(await preHashPassword(authKey, req.body.password), 10);
                await db.query('UPDATE users SET hashedPassword = ? WHERE uid = ?;', [hashedPassword, req.body.uid]);
                logger.info(
                    `User with UID ${req.auth?.uid} changed password for user ${req.body.username} with UID ${req.body.uid}`
                );
            }
            if (req.body.isAdmin != rows[0].isAdmin) {
                await db.query('UPDATE users SET isAdmin = ? WHERE uid = ?;', [req.body.isAdmin, req.body.uid]);
                logger.info(
                    `User with UID ${req.auth?.uid} ${
                        !rows[0].isAdmin && req.body.isAdmin ? 'granted' : 'revoked'
                    } administrator privileges for user ${req.body.username} with UID ${req.body.uid}`
                );
            }
            if (req.body.isHandler != rows[0].isHandler) {
                await db.query('UPDATE users SET isHandler = ? WHERE uid = ?;', [req.body.isHandler, req.body.uid]);
                logger.info(
                    `User with UID ${req.auth?.uid} ${
                        !rows[0].isHandler && req.body.isHandler ? 'granted' : 'revoked'
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
router.post('/deleteUser', async (req: JWTRequest, res: Response) => {
    if (!req.auth?.isAdmin) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /deleteUser without sufficient permissions`);
        return sendError(res, 403, 'Insufficient permissions');
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
                return sendError(res, 404, 'User does not exist');
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

export default router;
