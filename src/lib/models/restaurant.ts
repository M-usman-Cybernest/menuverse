import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const branchSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    mapsUrl: { type: String, required: true, trim: true },
    directionsLabel: { type: String, trim: true },
    tableCount: { type: Number, default: 0 },
  },
  { _id: false },
);

const timingSchema = new Schema(
  {
    day: { type: String, required: true },
    open: { type: String, required: true },
    close: { type: String, required: true },
    closed: { type: Boolean, default: false },
  },
  { _id: false },
);

const restaurantSchema = new Schema(
  {
    appId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    logoUrl: { type: String, trim: true },
    coverImageUrl: { type: String, trim: true },
    description: { type: String, trim: true },
    heroNote: { type: String, trim: true },
    cuisineLabel: { type: String, trim: true },
    locationLabel: { type: String, trim: true },
    locationMapsUrl: { type: String, trim: true },
    supportEmail: { type: String, trim: true, lowercase: true },
    isPublished: { type: Boolean, default: true },
    announcementBar: {
      text: { type: String, default: "" },
      show: { type: Boolean, default: false },
    },
    branches: [branchSchema],
    timings: [timingSchema],
  },
  {
    timestamps: true,
  },
);

export const RestaurantModel =
  models.Restaurant || model("Restaurant", restaurantSchema);
