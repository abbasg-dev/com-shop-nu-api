import express from 'express'
import { uploadOptions } from '../helpers/file-upload.js';

const router = express.Router();

import { 
    create,
    list,
    productById,
    updateProduct,
    remove,
    countProducts,
    countFeaturedProducts,
    multipleImageUpload
} from '../controllers/product.js';

router.post('/', uploadOptions.single('image'), create);
router.get('/', list);
router.route('/:id')
    .get(productById)
    .delete(remove)
router.put('/:id', uploadOptions.single('image'), updateProduct);
router.put('/gallery-images/:id', uploadOptions.array('images', 10), multipleImageUpload)
router.get('/get/count', countProducts);
router.get('/get/featured/:count', countFeaturedProducts);

export default router
