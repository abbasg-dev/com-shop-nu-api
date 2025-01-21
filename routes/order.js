import express from 'express'
const router = express.Router();

import { 
    list,
    create,
    orderById,
    updateOrderStatus,
    remove,
    totalSales,
    countOrders,
    userOrders
} from '../controllers/order.js';

router.post('/', create);
router.get('/', list);
router.route('/:id')
    .get(orderById)
    .delete(remove)
router.put('/:id/status', updateOrderStatus)
router.get('/get/total-sales', totalSales);
router.get('/get/count', countOrders);
router.get('/get/user-orders/:userid', userOrders);

export default router
