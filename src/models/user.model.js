const mongoose = require("mongoose");
const { isValidEmail } = require("../utils/email.util");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator(value) {
          return isValidEmail(value);
        },
        message: "Please provide a valid email address",
      },
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
    },
    currentOccupation: {
      type: String,
      trim: true,
    },
    currentWorkingOrganization: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
