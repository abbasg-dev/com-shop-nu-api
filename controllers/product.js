import asyncHandler from 'express-async-handler';
import Product from '../models/product.js';
import Category from '../models/category.js';

const create = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category)  res.status(400).json({
        message: 'Invalid Category'
    })

    const file = req.file;
    if (!file)  res.status(400).send('No image Uploaded');

    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    const product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });

    const createdProduct = await product.save()

    if (!product)
         res.status(500).json({
            message: 'Product cannot be created'
        })

    res.status(201).json(createdProduct);
});

const list = asyncHandler(async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = {
            category: req.query.categories.split(',')
        }
    }
    Product
        .find(filter).populate('category')
        .exec((err, products) => {
            if (err) {
                 res.status(400).json({
                    error: 'Products not found'
                })
            }
            res.json(products);
        });
});

const productById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category')

    if (product) {
        res.json(product)
    } else {
        res.status(404).json({
            message: 'Product not Found',
            success: false
        })
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    const categoryId = await Category.findById(req.body.category);
        if (!categoryId)  res.status(400).send('Invalid Category');

        const file = req.file;
        let imagepath;

        if (file) {
            const fileName = file.filename;
            const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
            imagepath = `${basePath}${fileName}`;
        }

        const {
            name,
            description,
            richDescription,
            brand,
            price,
            countInStock,
            rating,
            numReviews,
            isFeatured,
        } = req.body

        const product = await Product.findById(req.params.id)

        if (product) {
            product.name = name
            product.description = description
            product.richDescription = richDescription
            if (imagepath) {
                product.image = imagepath
            }
            product.brand = brand
            product.price = price
            product.category = categoryId
            product.countInStock = countInStock
            product.rating = rating
            product.numReviews = numReviews
            product.isFeatured = isFeatured

            const updatedProduct = await product.save()
            res.json(updatedProduct)
        } else {
            res.status(404).json({
                message: 'Product not Found',
                success: false
            })
        }
});

const remove = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)

    if (product) {
        await product.remove()
        res.json({
            message: 'Product removed',
            success: true
        })
    } else {
        res.status(404).json({
            message: 'Product not Found',
            success: false
        })
    }
});

const countProducts = asyncHandler(async (req, res) => {
    const productCount = await Product.countDocuments()
    if (!productCount) {
        res.status(500).json({ success: false })
    }
    res.send({
        productCount: productCount
    });
})

const countFeaturedProducts = asyncHandler(async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({ isFeatured: true }).limit(+count);
    if (!products) {
        res.status(500).json({ success: false })
    }
    res.send(products);
})

const multipleImageUpload = asyncHandler(async (req, res) => {
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    
    if (files) {
        files.map((file) => {
            imagesPaths.push(`${basePath}${file.filename}`);
        });
    } else {
        res.status(400).send('No images Uploaded');
    }

    const product = await Product.findById(req.params.id)

    if (product) {
        imagesPaths.map(item => {
            product.images.push(item)
        })

        const updatedProductGallery = await product.save()
        res.json(updatedProductGallery)
    } else {
        res.status(404).json({
            message: 'Product not Found',
            success: false
        })
    }
});

export {
    create,
    list,
    productById,
    updateProduct,
    remove,
    countProducts,
    countFeaturedProducts,
    multipleImageUpload
}
