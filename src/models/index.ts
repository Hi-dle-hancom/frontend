import mongoose from "mongoose";
import config from "../config";
import UserModel from "./user.model";
import GoodModel from "./good.model";
import AuctionModel from "./auction.model";

// MongoDB 연결 함수
export const connectToMongoDB = async (): Promise<boolean> => {
  try {
    // MongoDB URI 설정
    let uri = config.mongoUri;

    // 사용자 인증 정보가 있을 경우 URI에 추가
    if (config.mongoId && config.mongoPassword) {
      uri = uri.replace(
        "mongodb://",
        `mongodb://${config.mongoId}:${config.mongoPassword}@`,
      );
    }

    // MongoDB 연결 옵션
    const options: mongoose.ConnectOptions = {};

    // 연결 시도
    await mongoose.connect(uri, options);

    console.log("MongoDB 연결 성공");
    return true;
  } catch (error) {
    console.error("MongoDB 연결 오류:", error);
    return false;
  }
};

// 모델 내보내기
export { UserModel, GoodModel, AuctionModel };
