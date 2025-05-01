import asyncHandler from "express-async-handler";
import formidable from "formidable";
import Categories from "../models/category.js";
import cloudinary from "../config/cloudinary.js";

const { Category } = Categories;

const create = asyncHandler(async (req, res) => {
  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Failed to upload category" });
    }

    try {
      const createdCategory = await handleCategoryForm(fields, files);
      res.status(201).json({
        message: "Category created successfully!",
        category: createdCategory,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Failed to upload category" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    try {
      const updatedCategory = await handleCategoryForm(fields, files, category);
      res.status(200).json({
        message: "Category updated successfully!",
        category: updatedCategory,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});

const handleCategoryForm = async (fields = {}, files = {}, category = null) => {
  if (!fields || typeof fields !== "object") {
    throw new Error("Invalid fields structure.");
  }

  if (!files || typeof files !== "object") {
    throw new Error("Invalid files structure.");
  }

  const subcategories = [];
  const seenSubcategoryIds = new Set();

  Object.keys(fields).forEach((key) => {
    if (key.startsWith("subcategories[")) {
      const index = key.match(/\d+/)[0];
      const label = fields[`subcategories[${index}][label]`]?.[0] || "";
      const id = fields[`subcategories[${index}][id]`]?.[0] || "";

      if (!seenSubcategoryIds.has(id)) {
        const childCategories = [];
        let childIndex = 0;

        while (true) {
          const childLabelKey = `subcategories[${index}][childcategories][${childIndex}][label]`;
          const childIdKey = `subcategories[${index}][childcategories][${childIndex}][id]`;

          if (!fields[childLabelKey] || !fields[childIdKey]) break;

          const childLabel = fields[childLabelKey]?.[0] || "";
          const childId = fields[childIdKey]?.[0] || "";

          if (childLabel && childId) {
            childCategories.push({ label: childLabel, id: childId });
          }
          childIndex++;
        }

        subcategories.push({
          label,
          id,
          childcategories: childCategories,
        });

        seenSubcategoryIds.add(id);
      }
    }
  });

  const categoryname = fields["categoryname"]?.[0] || "";
  let categoryicon = "";

  if (files["categoryicon"] && files["categoryicon"][0]) {
    const filePath = files["categoryicon"][0].filepath;

    if (category && category.categoryicon) {
      const publicId = category.categoryicon.split("/").pop().split(".")[0];
      await cloudinary.v2.uploader.destroy(`blueseed/categories/${publicId}`);
    }

    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: "blueseed/categories",
    });

    categoryicon = result.secure_url;
  } else if (category) {
    categoryicon = category.categoryicon || "";
  }

  if (!categoryname) {
    throw new Error("Category name is required.");
  }

  const categoryData = {
    categoryname,
    categoryicon,
    subcategories,
  };

  let savedCategory;
  if (category) {
    categoryData._id = category._id;
    categoryData.categoryId = category.categoryId;

    await Category.updateOne(
      { _id: category._id },
      { $set: { subcategories: [] } }
    );

    savedCategory = await Category.findByIdAndUpdate(
      category._id,
      categoryData,
      { new: true }
    );
  } else {
    const categoryId = await generateNextCategoryId();
    categoryData.categoryId = categoryId;

    savedCategory = new Category(categoryData);
    await savedCategory.save();
  }

  return {
    __id: savedCategory._id,
    ...categoryData,
  };
};

const generateNextCategoryId = async () => {
  const lastCategory = await Category.findOne({})
    .sort({ categoryId: -1 })
    .lean();

  const lastId = lastCategory?.categoryId || "0346121"; // One less than start
  const nextId = String(parseInt(lastId, 10) + 1).padStart(7, "0");

  return nextId;
};

const list = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, search = "" } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const filter = search
    ? { categoryname: { $regex: search, $options: "i" } }
    : {};

  const categories = await Category.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  const total = await Category.countDocuments(filter);

  res.json({ categories, total, page, pages: Math.ceil(total / limit) });
});

const getById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }

  res.json(category);
});

const remove = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }

  await category.deleteOne();
  res.json({ message: "Category deleted successfully" });
});

export { create, update, list, remove, getById };
