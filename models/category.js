import mongoose from "mongoose";

const { model } = mongoose;

const childCategorySchema = new mongoose.Schema({
  label: { type: String, required: false },
  id: { type: String, required: false }, // Changed from value to id
});

const subcategorySchema = new mongoose.Schema({
  label: { type: String, required: false },
  id: { type: String, required: false }, // Changed from value to id
  childcategories: [childCategorySchema],
});

const categorySchema = new mongoose.Schema({
  categoryId: { type: String, required: true, unique: true },
  categoryname: { type: String, required: true },
  categoryicon: { type: String, required: true },
  subcategories: [subcategorySchema],
});

// Duplicate the ID field
categorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
categorySchema.set("toJSON", {
  virtuals: true,
});

const Subcategory = model("Subcategory", subcategorySchema);
const Category = model("Category", categorySchema);

export default { Category, Subcategory };
