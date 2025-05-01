import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const reviewSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    likes: [{ type: ObjectId, ref: "User" }],
    dislikes: [{ type: ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const purchaseHistorySchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: "User" },
    quantity: { type: Number, required: true },
    purchaseDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  richDescription: { type: String, default: "" },
  image: { type: String, required: true },
  images: [
    {
      url: String,
      publicId: String,
      dataURL: String,
    },
  ],
  brand: { type: ObjectId, ref: "Brand", required: true },
  originalPrice: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  priceAfterDiscount: { type: Number, default: 0 },
  category: { type: ObjectId, ref: "Category", required: true },
  subCategory: { type: String },
  childCategory: { type: String },
  countInStock: { type: Number, required: true, min: 0, max: 255 },
  isFeatured: { type: Boolean, default: false, index: true },
  dateCreated: { type: Date, default: Date.now },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  reviews: [reviewSchema],
  purchaseHistory: [purchaseHistorySchema],
  color: [{ type: ObjectId, ref: "Color", required: true }],
  weight: [{ type: ObjectId, ref: "Weight" }],
  ram: [{ type: ObjectId, ref: "Ram" }],
  size: [{ type: ObjectId, ref: "Size" }],
  shipping: { type: Boolean, default: false },
  returnable: { type: Boolean, default: true },
  returnPeriod: { type: String },
  shippingInfo: { type: String },
  orderCount: {
    type: Number,
    default: 0,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

// Duplicate the ID field
productSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
productSchema.set("toJSON", {
  virtuals: true,
});

const Product = mongoose.model("Product", productSchema);

export default Product;
