import { Schema, model } from "mongoose";
import { AuctionDocument } from "../types";

// 경매 입찰 스키마 정의
const auctionSchema = new Schema<AuctionDocument>({
  good: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Good",
    index: true, // 상품별 입찰 검색 성능 향상
  },
  bidder: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
    index: true, // 사용자별 입찰 검색 성능 향상
  },
  bid: {
    type: Number,
    required: true,
    min: 1,
  },
  msg: {
    type: String,
    required: false,
    trim: true,
    maxlength: 200,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // 생성 시간 정렬 성능 향상
  },
});

// 인덱스 설정
auctionSchema.index({ good: 1, bid: -1 }); // 특정 상품의 최고 입찰가 검색 성능 향상

// 모델 생성 및 내보내기
const AuctionModel = model<AuctionDocument>("Auction", auctionSchema);

export default AuctionModel;
