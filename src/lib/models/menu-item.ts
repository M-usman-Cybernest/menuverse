import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const menuItemSchema = new Schema(
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
    categoryId: {
      type: String,
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, trim: true },
    arModelUrl: { type: String, trim: true },
    arModelIosUrl: { type: String, trim: true },
    qrCodeUrl: { type: String, trim: true },
    dietaryTags: [{ type: String }],
    prepTime: { type: String, trim: true },
    featured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

export const MenuItemModel = models.MenuItem || model("MenuItem", menuItemSchema);
