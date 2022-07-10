import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { sendError, sendSuccess } from '../helper';
import { authKey } from '../secrets';

const router = Router();
router.get('/', async (req, res) => {
    jwt.verify(req.headers.authorization.replace('Bearer ', ''), authKey, (err) => {
        if (err) {
            sendError(res, 401);
        } else {
            sendSuccess(res);
        }
    });
});

export default router;
