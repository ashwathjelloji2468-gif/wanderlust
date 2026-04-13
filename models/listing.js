const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: "Cabins",
  },
  image: {
    url: {
      type: String,
      default: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    },
    filename: {
      type: String,
      default: "defaultimage",
    },
  },
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [78.4867, 17.3850],
      required: true,
    },
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Listing", listingSchema);