import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    phone: {
      type: String,
      required: [true, "Phone is required"],
    },

    age: {
      type: Number,
      min: [18, "Age must be between 18 and 60"],
      max: [60, "Age must be between 18 and 60"],
    },
  },
  {
    versionKey: false,
    strictQuery: true,
  },
);

export const userModel = mongoose.model("users", userSchema);
