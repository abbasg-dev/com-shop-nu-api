import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const orderSchema = mongoose.Schema({
  orderItems: [
    {
      type: ObjectId,
      ref: "OrderItem",
      required: true,
    },
  ],
  shippingAddress1: {
    type: String,
    required: true,
  },
  shippingAddress2: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  zip: {
    type: String,
    // required: true,
  },
  country: {
    type: String,
    required: true,
  },
  phone: {
    countryCode: {
      type: String,
    },
    dialCode: {
      type: String,
    },
    e164Number: {
      type: String,
    },
    internationalNumber: {
      type: String,
    },
    nationalNumber: {
      type: String,
    },
    number: {
      type: String,
    },
  },
  status: {
    type: String,
    required: true,
    default: "Pending",
  },
  totalPrice: {
    type: Number,
  },
  user: {
    type: ObjectId,
    ref: "User",
  },
  dateOrdered: {
    type: Date,
    default: Date.now,
  },
  paymentIntentId: {
    type: String,
    required: false,
  },
});

// Duplicate the ID field
orderSchema.virtual("id").get(function () {
  this._id.toHexString();
});

// Ensure virtual fields are serialised
orderSchema.set("toJSON", {
  virtuals: true,
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
