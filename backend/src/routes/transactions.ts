import { Response, Router } from 'express';
import { expressjwt, Request as JWTRequest } from 'express-jwt';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { FieldPacket, RowDataPacket } from 'mysql2';
import db from '../db';
import { sendError, sendSuccess } from '../helper';
import logger from '../logger';
import { authKey } from '../secrets';

const requiredFields: Array<string> = [
    'transactionDate',
    'transactionProduct',
    'transactionCount',
    'price',
    'actualTotal',
    'handler1',
];

const router = Router();
router.use(expressjwt({ secret: authKey, algorithms: ['HS256'] }));
router.post('/createTransaction', async (req: JWTRequest, res: Response) => {
    if (!(req.auth?.isAdmin || req.auth?.isHandler)) {
        logger.info(
            `User with UID ${req.auth?.uid} attempted to POST /createTransaction without sufficient permissions`
        );
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (
        !requiredFields.every((x) =>
            Object.keys(req.body)
                .filter((y) => requiredFields.includes(y))
                .includes(x)
        )
    ) {
        return sendError(
            res,
            400,
            `Missing field(s): ${requiredFields.filter((x) => !Object.keys(req.body).includes(x)).join(', ')}`
        );
    } else {
        try {
            await db.query('INSERT INTO transactions VALUES (DEFAULT, ?, ?, ?, ?, DEFAULT, ?, ?, ?, ?, ?)', [
                new Date(req.body.transactionDate),
                req.body.transactionProduct,
                req.body.transactionCount,
                req.body.price,
                req.body.actualTotal,
                req.body.handler1,
                req.body.handler2,
                req.body.handler3,
                req.body.remarks,
            ]);
            logger.info(`User with UID ${req.auth?.uid} created new transaction`);
            logger.info(`Transaction info: ${req.body}`);
            return sendSuccess(res);
        } catch (e) {
            sendError(res, 500);
            logger.error(e);
        }
    }
});
router.get('/getTransactions', async (req: JWTRequest, res: Response) => {
    try {
        const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query('SELECT * from transactions;');
        logger.info(`User with UID ${req.auth?.uid} requested info on all transactions`);
        return sendSuccess(res, rows);
    } catch (e) {
        sendError(res, 500);
        logger.error(e);
    }
});
router.post('/updateTransaction', async (req: JWTRequest, res: Response) => {
    if (!req.auth?.isAdmin) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /updateUser without sufficient permissions`);
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (!req.body.tid) {
        sendError(res, 400, 'Transaction ID not provided');
    } else {
        try {
            const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
                'SELECT * FROM transactions WHERE tid = ? LIMIT 1;',
                [req.body.uid]
            );
            if (!rows.length) {
                return sendError(res, 400, 'Transaction does not exist');
            }
            await db.query(
                'UPDATE transactions SET t_date = ?, t_product = ?, t_count = ?, price = ?, act_total = ?, handler1 = ?, handler2 = ?, handler3 = ?, remarks = ? WHERE tid = ?',
                [
                    req.body.transactionDate ?? rows[0].t_date,
                    req.body.transactionProduct ?? rows[0].t_product,
                    req.body.transactionCount ?? rows[0].t_count,
                    req.body.price ?? rows[0].price,
                    req.body.actualTotal ?? rows[0].act_total,
                    req.body.handler1 ?? rows[0].handler1,
                    req.body.handler2 ?? rows[0].handler2,
                    req.body.handler3 ?? rows[0].handler3,
                    req.body.remarks ?? rows[0].remarks,
                    req.body.tid,
                ]
            );
            logger.info(`User with UID ${req.auth?.uid} updated transaction with TID ${req.body.tid}`);
            logger.info(`Transaction change-set: ${req.body}`);
            return sendSuccess(res);
        } catch (e) {
            sendError(res, 500);
            logger.error(e);
        }
    }
});
router.post('/deleteTransaction', async (req: JWTRequest, res: Response) => {
    if (!req.auth?.isAdmin) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /deleteUser without sufficient permissions`);
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (!req.body.uid) {
        sendError(res, 400, 'Transaction ID not provided');
    } else {
        try {
            const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query(
                'SELECT * FROM transactions WHERE tid = ? LIMIT 1;',
                [req.body.tid]
            );
            if (!rows.length) {
                return sendError(res, 400, 'Transaction does not exist');
            }
            await db.query('DELETE FROM transactions WHERE tid = ?', [req.body.tid]);
            logger.info(`User with UID ${req.auth?.uid} deleted transaction with TID ${req.body.tid}`);
            logger.info(`Transaction info: ${rows[0]}`);
            return sendSuccess(res);
        } catch (e) {
            sendError(res, 500);
            logger.error(e);
        }
    }
});

export default router;
