import mongoose from "mongoose";

const brandSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  brandicon: { type: String, required: true },
});

// Duplicate the ID field
brandSchema.virtual("id").get(function () {
  this._id.toHexString();
});

// Ensure virtual fields are serialised
brandSchema.set("toJSON", {
  virtuals: true,
});

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
