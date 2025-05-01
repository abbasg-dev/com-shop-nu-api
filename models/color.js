import mongoose from "mongoose";

const colorSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
});

// Duplicate the ID field
colorSchema.virtual("id").get(function () {
  this._id.toHexString();
});

// Ensure virtual fields are serialised
colorSchema.set("toJSON", {
  virtuals: true,
});

const Color = mongoose.model("Color", colorSchema);

export default Color;
