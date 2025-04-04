const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    married: {
      type: Boolean,
      required: true,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// 소프트 삭제를 위한 미들웨어
userSchema.pre("find", function () {
  this.where({ deleted_at: null });
});

userSchema.pre("findOne", function () {
  this.where({ deleted_at: null });
});

module.exports = mongoose.model("User", userSchema);
