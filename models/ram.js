import mongoose from "mongoose";

const ramSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

// Duplicate the ID field
ramSchema.virtual("id").get(function () {
  this._id.toHexString();
});

// Ensure virtual fields are serialised
ramSchema.set("toJSON", {
  virtuals: true,
});

const Ram = mongoose.model("Ram", ramSchema);

export default Ram;
