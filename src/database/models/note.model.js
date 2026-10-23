import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Custom validator: the title must NOT be entirely uppercase.
 *  "FIRST NOTE" -> invalid      "First Note" -> valid
 * A title with no letters at all (e.g. "123") is not "uppercase", so it is allowed.
 */
export const isNotEntirelyUppercase = (value) =>
  !(value === value.toUpperCase() && value !== value.toLowerCase());

const noteSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      validate: {
        validator: isNotEntirelyUppercase,
        message: "Title must not be entirely uppercase",
      },
    },

    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "userId is required"],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strictQuery: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id; // exposed as "id" in the responses
        return ret;
      },
    },
  },
);

export const noteModel = mongoose.model("notes", noteSchema);
