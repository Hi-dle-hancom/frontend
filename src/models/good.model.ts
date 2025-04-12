import { Schema, model, Types } from "mongoose";
import { GoodDocument } from "../types";

// 상품 스키마 정의
const goodSchema = new Schema<GoodDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    img: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["SALE", "SOLD", "RESERVE"],
      default: "SALE",
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    buyer: {
      type: Schema.Types.ObjectId,
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
      index: true, // 삭제 여부로 필터링할 때 성능 향상
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    // 가상 필드를 JSON으로 변환할 때 포함
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 인덱스 설정
goodSchema.index({ createdAt: -1 }); // 최신순 정렬 성능 향상
goodSchema.index({ endTime: 1, status: 1 }); // 경매 종료 검색 성능 향상
goodSchema.index({ owner: 1, deleted: 1 }); // 사용자별 상품 검색 성능 향상

// 가상 필드 (입찰 정보)
goodSchema.virtual("auctions", {
  ref: "Auction",
  localField: "_id",
  foreignField: "good",
});

// 모델 생성 및 내보내기
const GoodModel = model<GoodDocument>("Good", goodSchema);

export default GoodModel;
