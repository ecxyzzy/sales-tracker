import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { FieldPacket, RowDataPacket } from 'mysql2';
import db from '../db';
import { preHashPassword, sendError, sendSuccess } from '../helper';
import logger from '../logger';
import { authKey } from '../secrets';

const router = Router();
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
                    await preHashPassword(authKey, req.body.password),
                    rows[0].hashedPassword
                );
                if (result) {
                    logger.info(`User with UID ${rows[0].uid} logged in successfully`);
                    return sendSuccess(res, {
                        token: jwt.sign(
                            { uid: rows[0].uid, isAdmin: rows[0].isAdmin, isHandler: rows[0].isHandler },
                            authKey,
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

export default router;
