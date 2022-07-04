import { Router } from 'express';
import { sendError } from './helper';
import login from './routes/login';
import products from './routes/products';
import transactions from './routes/transactions';
import users from './routes/users';

// router configuration
const router = Router();

router.use(login);
router.use(products);
router.use(transactions);
router.use(users);
router.use((req, res) => {
    sendError(res, 404);
});

export default router;
