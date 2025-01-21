import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  passwordHash: {
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
  isAdmin: {
    type: Boolean,
    default: false,
  },
  street: {
    type: String,
    default: "",
  },
  apartment: {
    type: String,
    default: "",
  },
  zip: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  country: {
    type: String,
    default: "",
  },
  otp: {
    code: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
    },
  },
});

// Duplicate the ID field
userSchema.virtual("id").get(function () {
  this._id.toHexString();
});

// Ensure virtual fields are serialised
userSchema.set("toJSON", {
  virtuals: true,
});

const User = mongoose.model("User", userSchema);

export default User;
