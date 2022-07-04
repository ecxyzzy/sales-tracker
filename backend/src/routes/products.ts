import { Response, Router } from 'express';
import { expressjwt, Request as JWTRequest } from 'express-jwt';
import { FieldPacket, RowDataPacket } from 'mysql2';
import db from '../db';
import { sendError, sendSuccess } from '../helper';
import logger from '../logger';
import { authKey } from '../secrets';

const router = Router();
router.use(expressjwt({ secret: authKey, algorithms: ['HS256'] }));
router.post('/createProduct', async (req: JWTRequest, res: Response) => {
    if (!(req.auth?.isAdmin || req.auth?.isHandler)) {
        logger.info(`User with UID ${req.auth?.uid} attempted to POST /createProduct without sufficient permissions`);
        return sendError(res, 401, 'Insufficient permissions');
    }
    if (!req.body.productName) {
        sendError(res, 400, 'Product name not provided');
    } else {
        try {
            await db.query('INSERT INTO products VALUES (DEFAULT, ?);', [req.body.productName]);
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
router.get('/getProducts', async (req: JWTRequest, res: Response) => {
    try {
        const [rows]: [RowDataPacket[], FieldPacket[]] = await db.query('SELECT pid, p_name FROM products;');
        logger.info(`User with UID ${req.auth?.uid} requested info on all products`);
        return sendSuccess(res, rows);
    } catch (e) {
        sendError(res, 500);
        logger.error(e);
    }
});
router.post('/updateProduct', async (req: JWTRequest, res: Response) => {
    if (!(req.auth?.isAdmin || req.auth?.isHandler)) {
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
router.post('/deleteProduct', async (req: JWTRequest, res: Response) => {
    if (!(req.auth?.isAdmin || req.auth?.isHandler)) {
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

export default router;
