import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const menuCategorySchema = new Schema(
  {
    appId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

export const MenuCategoryModel =
  models.MenuCategory || model("MenuCategory", menuCategorySchema);
