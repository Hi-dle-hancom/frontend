const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const { Schema } = mongoose;
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  nick: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  money: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
