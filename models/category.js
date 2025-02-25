import mongoose from "mongoose";

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
    },
    color: {
      type: String,
    },
    subcategory: [
      {
        value: { type: mongoose.Schema.Types.Mixed },
        label: { type: String },
      },
    ],
  },
  { timestamps: true }
);

categorySchema.virtual("id").get(function () {
  this._id.toHexString();
});

categorySchema.set("toJSON", {
  virtuals: true,
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
