import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import { UserDocument } from "../types";
import config from "../config";

// 사용자 스키마 정의
const userSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  nick: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  money: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 비밀번호 해싱 미들웨어
userSchema.pre<UserDocument>("save", async function (next) {
  // 비밀번호가 변경된 경우에만 해싱
  if (this.isModified("password")) {
    try {
      this.password = await bcrypt.hash(
        this.password,
        config.bcrypt.saltRounds,
      );
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// 비밀번호 비교 메소드
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 중복 방지를 위한 인덱스 생성
userSchema.index({ email: 1 }, { unique: true });

// 모델 생성 및 내보내기
const UserModel = model<UserDocument>("User", userSchema);

export default UserModel;
