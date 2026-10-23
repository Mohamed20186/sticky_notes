import mongoose from "mongoose";
import { AppError } from "../middleware/errorHandler.js";

/**
 * The logged-in user's id is sent in the query params (?id=...).
 * Validates it before it is used in a query or an aggregation.
 */
export const getUserId = (id) => {
  if (!id) {
    throw new AppError("User id is required in the query params (?id=...)", 400);
  }
  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid user id", 400);
  }
  return id;
};
