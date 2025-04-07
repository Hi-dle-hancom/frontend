const mongoose = require("mongoose");

const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;
const goodSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ["SALE", "SOLD", "RESERVE"],
    default: "SALE",
  },
  owner: {
    type: ObjectId,
    required: true,
    ref: "User",
  },
  buyer: {
    type: ObjectId,
    ref: "User",
  },
  endTime: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Good", goodSchema);
