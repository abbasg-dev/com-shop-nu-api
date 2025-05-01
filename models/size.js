import mongoose from "mongoose";

const sizeSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

// Duplicate the ID field
sizeSchema.virtual("id").get(function () {
  this._id.toHexString();
});

// Ensure virtual fields are serialised
sizeSchema.set("toJSON", {
  virtuals: true,
});

const Size = mongoose.model("Size", sizeSchema);

export default Size;
