 const mongoose = require("mongoose");
const { authorize } = require("passport");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  comment: String,
  rating: Number,
  username: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;