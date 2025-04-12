import { Types } from "mongoose";
import { GoodModel, AuctionModel } from "../models";
import { ServiceResponse, GoodDocument, AuctionDocument } from "../types";

/**
 * 경매 상태 주기적 체크 서비스
 * 종료 시간이 지난 경매를 처리하는 함수
 */
export const checkAuctionStatus = async (): Promise<ServiceResponse> => {
  try {
    console.log("경매 상태 체크 서비스 실행");

    // 현재 시간이 경매 종료 시간을 지났지만 상태가 여전히 'SALE'인 상품들 조회
    const expiredGoods = await GoodModel.find({
      status: "SALE",
      endTime: { $lte: new Date() },
      deleted: { $ne: true },
    });

    // 처리된 경매 개수 추적
    let completedCount = 0;
    let reservedCount = 0;

    // 각 만료된 경매에 대해 처리
    for (const good of expiredGoods) {
      // 가장 높은 입찰가 찾기
      const highestBid = await AuctionModel.findOne({ good: good._id })
        .sort("-bid")
        .populate("bidder");

      if (highestBid) {
        // 입찰이 있으면 상품 상태 변경 및 구매자 설정
        await GoodModel.findByIdAndUpdate(good._id, {
          status: "SOLD",
          buyer: highestBid.bidder._id,
        });

        completedCount++;
        console.log(
          `경매 완료: ${good.name}, 최종 가격: ${highestBid.bid}, 구매자: ${
            (highestBid.bidder as any).nick
          }`,
        );
      } else {
        // 입찰이 없으면 예약 상태로 변경
        await GoodModel.findByIdAndUpdate(good._id, {
          status: "RESERVE",
        });

        reservedCount++;
        console.log(`경매 유찰: ${good.name}`);
      }
    }

    return {
      success: true,
      data: {
        total: expiredGoods.length,
        completed: completedCount,
        reserved: reservedCount,
      },
    };
  } catch (error) {
    console.error("경매 상태 체크 오류", error);
    return {
      success: false,
      error: `경매 상태 체크 중 오류 발생: ${(error as Error).message}`,
    };
  }
};

/**
 * 상품 삭제 서비스
 * @param goodId 삭제할 상품 ID
 */
export const removeGood = async (goodId: string): Promise<ServiceResponse> => {
  try {
    // 유효한 ObjectId인지 확인
    if (!Types.ObjectId.isValid(goodId)) {
      return {
        success: false,
        error: "유효하지 않은 상품 ID",
      };
    }

    // 상품이 존재하는지 확인
    const good = await GoodModel.findById(goodId);
    if (!good) {
      return {
        success: false,
        error: "존재하지 않는 상품",
      };
    }

    // 상품을 삭제하지 않고 상태만 변경
    await GoodModel.findByIdAndUpdate(goodId, {
      $set: {
        deleted: true,
        deletedAt: new Date(),
      },
    });

    return {
      success: true,
      data: { id: goodId },
    };
  } catch (error) {
    console.error("상품 삭제 오류", error);
    return {
      success: false,
      error: `상품 삭제 중 오류 발생: ${(error as Error).message}`,
    };
  }
};

/**
 * 입찰 생성 서비스
 * @param goodId 상품 ID
 * @param userId 입찰자 ID
 * @param bid 입찰가
 * @param msg 입찰 메시지
 */
export const createBid = async (
  goodId: string,
  userId: string,
  bid: number,
  msg?: string,
): Promise<ServiceResponse<AuctionDocument>> => {
  try {
    // 상품 조회
    const good = await GoodModel.findById(goodId);

    // 상품 유효성 검사
    if (!good) {
      return { success: false, error: "존재하지 않는 상품입니다" };
    }

    if (good.status !== "SALE") {
      return { success: false, error: "판매 중인 상품이 아닙니다" };
    }

    if (good.price >= bid) {
      return { success: false, error: "시작 가격보다 높게 입찰해야 합니다" };
    }

    if (new Date(good.endTime).valueOf() < new Date().valueOf()) {
      return { success: false, error: "경매가 이미 종료되었습니다" };
    }

    if (good.owner.toString() === userId) {
      return {
        success: false,
        error: "자신이 등록한 상품은 입찰할 수 없습니다",
      };
    }

    // 최고 입찰가 확인
    const highestBid = await AuctionModel.findOne({ good: goodId }).sort(
      "-bid",
    );
    if (highestBid && highestBid.bid >= bid) {
      return { success: false, error: "이전 입찰가보다 높아야 합니다" };
    }

    // 새 입찰 생성
    const auction = await AuctionModel.create({
      good: goodId,
      bidder: userId,
      bid,
      msg,
    });

    // 입찰자 정보 포함하여 반환
    await auction.populate("bidder", "nick");

    return { success: true, data: auction };
  } catch (error) {
    console.error("입찰 생성 오류", error);
    return {
      success: false,
      error: `입찰 생성 중 오류 발생: ${(error as Error).message}`,
    };
  }
};

/**
 * 특정 상품의 입찰 내역 조회 서비스
 * @param goodId 상품 ID
 */
export const getAuctionsByGoodId = async (
  goodId: string,
): Promise<ServiceResponse> => {
  try {
    const auctions = await AuctionModel.find({ good: goodId })
      .populate("bidder", "nick")
      .sort("bid")
      .lean();

    return { success: true, data: auctions };
  } catch (error) {
    console.error("입찰 내역 조회 오류", error);
    return {
      success: false,
      error: `입찰 내역 조회 중 오류 발생: ${(error as Error).message}`,
    };
  }
};
