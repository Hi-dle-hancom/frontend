const mongoose = require("mongoose");

const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;
const auctionSchema = new Schema({
  good: {
    type: ObjectId,
    required: true,
    ref: "Good",
  },
  bidder: {
    type: ObjectId,
    required: true,
    ref: "User",
  },
  bid: {
    type: Number,
    required: true,
  },
  msg: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Auction", auctionSchema);
