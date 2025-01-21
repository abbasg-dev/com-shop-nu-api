import asyncHandler from 'express-async-handler';
import Category from '../models/category.js';

const create = asyncHandler(async (req, res) => {
    const category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
    });

    const createdCategory = await category.save()

    if(!createdCategory)
     res.status(400).send('the category cannot be created!')

    res.status(201).json(createdCategory);
});

const list = asyncHandler(async (req, res) => {
    Category
        .find()
        .exec((err, categories) => {
            if (err) {
                 res.status(404).json({
                    error: 'Categories not found'
                })
            }
            res.json(categories);
        });
});

const remove = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id)

    if(category) {
        await category.remove()
        res.json({ 
            message: 'Category removed',
            success: true
        })
    } else {
        res.status(404).json({
            message: 'Category not Found',
            success: false
        })
    }
});

const categoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id)

    if(category) {
        res.json(category)
    } else {
        res.status(404).json({
            message: 'Category not Found',
            success: false
        })
    }
});

const updateCategory = asyncHandler(async (req, res) => {
    const {
        name, 
        icon, 
        color, 
    } = req.body
    
    const category = await Category.findById(req.params.id)

    if(category) {
        category.name = name
        category.icon = icon
        category.color = color
        const updatedCategory = await category.save()
        res.json(updatedCategory)
    } else {
        res.status(404).json({
            message: 'Category not Found',
            success: false
        })
    }
})

export {
    create,
    list,
    remove,
    categoryById,
    updateCategory
}
