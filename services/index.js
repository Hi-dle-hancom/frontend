const Good = require("../schemas/good");
const Auction = require("../schemas/auction");

exports.checkAuctionStatus = async () => {
  try {
    console.log("경매 상태 체크 서비스 실행");

    // 현재 시간이 경매 종료 시간을 지났지만 상태가 여전히 'SALE'인 상품들 체크
    const expiredGoods = await Good.find({
      status: "SALE",
      endTime: { $lte: new Date() },
    });

    for (const good of expiredGoods) {
      // 가장 높은 입찰가 찾기
      const highestBid = await Auction.findOne({ good: good._id })
        .sort("-bid")
        .populate("bidder");

      if (highestBid) {
        // 상품 상태 변경 및 구매자 설정
        await Good.findByIdAndUpdate(good._id, {
          status: "SOLD",
          buyer: highestBid.bidder._id,
        });
        console.log(
          `경매 완료: ${good.name}, 최종 가격: ${highestBid.bid}, 구매자: ${highestBid.bidder.nick}`
        );
      } else {
        // 입찰이 없으면 예약 상태로 변경
        await Good.findByIdAndUpdate(good._id, {
          status: "RESERVE",
        });
        console.log(`경매 유찰: ${good.name}`);
      }
    }
  } catch (error) {
    console.error("경매 상태 체크 오류", error);
  }
};

exports.removeGood = async (goodId) => {
  try {
    // 상품을 삭제하지 않고 상태만 변경
    await Good.findByIdAndUpdate(goodId, {
      $set: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
    // 입찰 내역은 삭제하지 않음
  } catch (error) {
    throw error;
  }
};
