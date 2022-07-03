import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Router } from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { FieldPacket, RowDataPacket } from 'mysql2';
import db from './db';

const secret = fs.readFileSync(process.env.AUTH_KEY_PATH);
const router = Router();

router.post('/login', async (req, res) => {
    const timestamp = new Date().toISOString();
    if (!req.body.username) {
        res.status(400);
        res.json({
            timestamp: timestamp,
            status: 400,
            error: 'Bad Request',
            message: 'Username not provided',
        });
    } else if (!req.body.password) {
        res.status(400);
        res.json({
            timestamp: timestamp,
            status: 400,
            error: 'Bad Request',
            message: 'Password not provided',
        });
    } else {
        const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
            'SELECT uid, username, pswdhash FROM users WHERE username = ? LIMIT 1;',
            [req.body.username]
        );
        if (rows.length) {
            console.log()
            const result = await bcrypt.compare(
                Buffer.from(
                    crypto.createHmac('sha384', secret).update(req.body.password).digest('hex'),
                    'hex'
                ).toString('base64'),
                rows[0].pswdhash
            );
            if (result) {
                res.status(200);
                res.json({
                    timestamp: timestamp,
                    status: 200,
                    token: jwt.sign({uid: rows[0].uid}, secret, { expiresIn: '1h' }),
                });
                return;
            }
        }
        res.status(401);
        res.json({
            timestamp: timestamp,
            status: 401,
            error: 'Unauthorized',
            message: 'Invalid username or password',
        });
    }
});

export default router;
