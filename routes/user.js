import express from 'express'
const router = express.Router();

import { 
    create,
    list,
    userById,
    updateUser,
    countUsers,
    remove
} from '../controllers/user.js';

router.post('/', create);
router.get('/', list);
router.route('/:id')
    .get(userById)
    .put(updateUser)
    .delete(remove)
router.get('/get/count', countUsers);

export default router
