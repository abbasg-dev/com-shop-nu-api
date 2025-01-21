import express from 'express'
const router = express.Router();

import { 
    create,
    list,
    remove,
    categoryById,
    updateCategory
} from '../controllers/category.js';

router.post('/', create);
router.get('/', list);
router.route('/:id')
    .get(categoryById)
    .delete(remove)
    .put(updateCategory)

export default router
