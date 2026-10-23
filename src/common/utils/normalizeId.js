import mongoose from "mongoose"

export const normlizeId = id => new mongoose.Types.ObjectId(id)