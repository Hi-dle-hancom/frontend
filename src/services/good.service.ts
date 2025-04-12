import { GoodModel, AuctionModel } from "../models";
import { ServiceResponse, GoodDocument } from "../types";
import { Types } from "mongoose";

interface CreateGoodData {
  name: string;
  price: number;
  img?: string;
  endTime: Date;
  owner: string;
}

/**
 * 상품 생성 서비스
 * @param goodData 상품 데이터
 */
export const createGood = async (
  goodData: CreateGoodData,
): Promise<ServiceResponse<GoodDocument>> => {
  try {
    // 필수 필드 확인
    if (
      !goodData.name ||
      !goodData.price ||
      !goodData.endTime ||
      !goodData.owner
    ) {
      return {
        success: false,
        error: "필수 필드가 누락되었습니다",
      };
    }

    // 종료 시간이 현재보다 미래인지 확인
    if (new Date(goodData.endTime) <= new Date()) {
      return {
        success: false,
        error: "종료 시간은 현재 시간보다 이후여야 합니다",
      };
    }

    // 가격이 양수인지 확인
    if (goodData.price < 0) {
      return {
        success: false,
        error: "가격은 0 이상이어야 합니다",
      };
    }

    // 새 상품 생성
    const good = await GoodModel.create({
      name: goodData.name,
      img: goodData.img || null,
      price: goodData.price,
      endTime: goodData.endTime,
      owner: goodData.owner,
      status: "SALE",
      deleted: false,
    });

    return {
      success: true,
      data: good,
    };
  } catch (error) {
    console.error("상품 생성 오류", error);
    return {
      success: false,
      error: `상품 생성 중 오류 발생: ${(error as Error).message}`,
    };
  }
};

/**
 * 판매 중인 상품 목록 조회 서비스
 */
export const getAllActiveGoods = async (): Promise<
  ServiceResponse<GoodDocument[]>
> => {
  try {
    const goods = await GoodModel.find({
      status: "SALE",
      deleted: { $ne: true },
    })
      .populate("owner", "nick")
      .sort("-createdAt");

    return {
      success: true,
      data: goods,
    };
  } catch (error) {
    console.error("상품 목록 조회 오류", error);
    return {
      success: false,
      error: `상품 목록 조회 중 오류 발생: ${(error as Error).message}`,
    };
  }
};

/**
 * 사용자별 상품 목록 조회 서비스
 * @param userId 사용자 ID
 */
export const getGoodsByUserId = async (
  userId: string,
): Promise<ServiceResponse> => {
  try {
    // 사용자가 등록한 상품 조회
    const goods = await GoodModel.find({
      owner: userId,
      deleted: { $ne: true },
    })
      .populate("buyer", "nick")
      .sort("-createdAt");

    // 각 상품에 대한 입찰 정보 추가
    const goodsWithBidInfo = await Promise.all(
      goods.map(async (good) => {
        const highestBid = await AuctionModel.findOne({ good: good._id }).sort(
          "-bid",
        );
        const bidCount = await AuctionModel.countDocuments({ good: good._id });

        // JavaScript 객체로 변환하고 추가 정보 설정
        const goodObj = good.toObject();
        goodObj.highestBid = highestBid ? highestBid.bid : 0;
        goodObj.bidCount = bidCount;

        return goodObj;
      }),
    );

    return {
      success: true,
      data: goodsWithBidInfo,
    };
  } catch (error) {
    console.error("사용자별 상품 조회 오류", error);
    return {
      success: false,
      error: `사용자별 상품 조회 중 오류 발생: ${(error as Error).message}`,
    };
  }
};

/**
 * 상품 상세 조회 서비스
 * @param goodId 상품 ID
 */
export const getGoodById = async (goodId: string): Promise<ServiceResponse> => {
  try {
    // ID 유효성 검사
    if (!Types.ObjectId.isValid(goodId)) {
      return {
        success: false,
        error: "유효하지 않은 상품 ID",
      };
    }

    // 상품 조회 및 소유자 정보 포함
    const good = await GoodModel.findById(goodId).populate("owner", "nick");

    if (!good) {
      return {
        success: false,
        error: "존재하지 않는 상품",
      };
    }

    // 입찰 내역 조회
    const auctions = await AuctionModel.find({ good: goodId })
      .populate("bidder", "nick")
      .sort("bid");

    // 상품 객체에 입찰 내역 추가
    const goodWithBids = good.toObject();
    goodWithBids.bid = auctions.map((auction) => ({
      bid: auction.bid,
      msg: auction.msg,
      user: { nick: (auction.bidder as any).nick },
      createdAt: auction.createdAt,
    }));

    return {
      success: true,
      data: {
        good: goodWithBids,
        auctions,
      },
    };
  } catch (error) {
    console.error("상품 상세 조회 오류", error);
    return {
      success: false,
      error: `상품 상세 조회 중 오류 발생: ${(error as Error).message}`,
    };
  }
};
