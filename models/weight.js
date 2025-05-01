import mongoose from "mongoose";

const weightSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

// Duplicate the ID field
weightSchema.virtual("id").get(function () {
  this._id.toHexString();
});

// Ensure virtual fields are serialised
weightSchema.set("toJSON", {
  virtuals: true,
});

const Weight = mongoose.model("Weight", weightSchema);

export default Weight;
