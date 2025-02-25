import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import Category from "../models/category.js";

const create = asyncHandler(async (req, res) => {
  const { name, icon, color, subcategory = [] } = req.body;

  const subcategoryData = (subcategory || [])
    .map((sub) => ({
      value: mongoose.isValidObjectId(sub.value)
        ? new mongoose.Types.ObjectId(sub.value)
        : sub.value,
      label: sub.label,
    }))
    .filter((sub) => sub.value !== null);

  const category = new Category({
    name,
    icon,
    color,
    subcategory: subcategoryData,
  });

  const createdCategory = await category.save();

  if (!createdCategory) {
    return res.status(400).send("The category cannot be created!");
  }

  res.status(201).json(createdCategory);
});

const list = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, search = "", parentCategory = null } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {};
  if (search) filter.name = { $regex: search, $options: "i" };
  if (parentCategory) filter.subcategory = parentCategory;

  try {
    const categories = await Category.find(filter)
      .populate("subcategory", "name")
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await Category.countDocuments(filter);

    res.json({
      categories,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

const categoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate(
    "subcategory",
    "name"
  );
  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }
  res.json(category);
});

const remove = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }
  res.json({ message: "Category deleted successfully" });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { name, icon, color, subcategory } = req.body;

  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }

  category.name = name || category.name;
  category.icon = icon || category.icon;
  category.color = color || category.color;

  if (subcategory) {
    category.subcategory = subcategory.map((sub) => ({
      value: mongoose.isValidObjectId(sub.value)
        ? new mongoose.Types.ObjectId(sub.value)
        : sub.value,
      label: sub.label,
    }));
  }

  const updatedCategory = await category.save();

  res.json(updatedCategory);
});

export { create, list, remove, categoryById, updateCategory };
