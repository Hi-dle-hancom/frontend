import { checkAuctionStatus, createBid, removeGood } from "../../services";
import { GoodModel, AuctionModel } from "../../models";
import mongoose from "mongoose";

// GoodModel 및 AuctionModel 모킹
jest.mock("../../models", () => ({
  GoodModel: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  AuctionModel: {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    populate: jest.fn(),
  },
}));

describe("Auction Service Tests", () => {
  beforeEach(() => {
    // 각 테스트 전에 모든 모킹 함수 초기화
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("checkAuctionStatus", () => {
    it("should update goods with expired auction time", async () => {
      // 모의 데이터 설정
      const expiredGoods = [
        { _id: "good1", name: "Test Good 1" },
        { _id: "good2", name: "Test Good 2" },
      ];

      const highestBid = {
        bidder: { _id: "user1", nick: "User 1" },
        bid: 1000,
      };

      // 모킹 함수 구현
      (GoodModel.find as jest.Mock).mockResolvedValue(expiredGoods);
      (AuctionModel.findOne as jest.Mock).mockImplementation((query) => {
        if (query.good === "good1") {
          return {
            sort: jest.fn().mockImplementation(() => ({
              populate: jest.fn().mockResolvedValue(highestBid),
            })),
          };
        } else {
          return {
            sort: jest.fn().mockImplementation(() => ({
              populate: jest.fn().mockResolvedValue(null),
            })),
          };
        }
      });
      (GoodModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      // 함수 실행
      const result = await checkAuctionStatus();

      // 검증
      expect(result.success).toBe(true);
      expect(GoodModel.find).toHaveBeenCalledWith({
        status: "SALE",
        endTime: { $lte: expect.any(Date) },
        deleted: { $ne: true },
      });
      expect(GoodModel.findByIdAndUpdate).toHaveBeenCalledTimes(2);
      expect(GoodModel.findByIdAndUpdate).toHaveBeenCalledWith("good1", {
        status: "SOLD",
        buyer: "user1",
      });
      expect(GoodModel.findByIdAndUpdate).toHaveBeenCalledWith("good2", {
        status: "RESERVE",
      });
      expect(result.data).toEqual({
        total: 2,
        completed: 1,
        reserved: 1,
      });
    });

    it("should handle errors during auction check", async () => {
      // 오류 시나리오 모의
      (GoodModel.find as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      // 함수 실행
      const result = await checkAuctionStatus();

      // 검증
      expect(result.success).toBe(false);
      expect(result.error).toContain("경매 상태 체크 중 오류 발생");
    });
  });

  describe("removeGood", () => {
    it("should mark a good as deleted", async () => {
      // 모의 데이터 설정
      const goodId = new mongoose.Types.ObjectId().toString();
      const existingGood = { _id: goodId, name: "Test Good" };

      // 모킹 함수 구현
      (GoodModel.findById as jest.Mock).mockResolvedValue(existingGood);
      (GoodModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...existingGood,
        deleted: true,
      });

      // 함수 실행
      const result = await removeGood(goodId);

      // 검증
      expect(result.success).toBe(true);
      expect(GoodModel.findByIdAndUpdate).toHaveBeenCalledWith(goodId, {
        $set: {
          deleted: true,
          deletedAt: expect.any(Date),
        },
      });
      expect(result.data).toEqual({ id: goodId });
    });

    it("should handle non-existent good", async () => {
      // 존재하지 않는 상품 시나리오
      const goodId = new mongoose.Types.ObjectId().toString();
      (GoodModel.findById as jest.Mock).mockResolvedValue(null);

      // 함수 실행
      const result = await removeGood(goodId);

      // 검증
      expect(result.success).toBe(false);
      expect(result.error).toBe("존재하지 않는 상품");
      expect(GoodModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle invalid ObjectId", async () => {
      // 잘못된 ID 시나리오
      const result = await removeGood("invalid-id");

      // 검증
      expect(result.success).toBe(false);
      expect(result.error).toBe("유효하지 않은 상품 ID");
      expect(GoodModel.findById).not.toHaveBeenCalled();
    });
  });

  describe("createBid", () => {
    it("should create a new bid for a good", async () => {
      // 모의 데이터 설정
      const goodId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const bid = 1000;
      const msg = "입찰합니다";

      const good = {
        _id: goodId,
        price: 500,
        status: "SALE",
        endTime: new Date(Date.now() + 3600000), // 1시간 후
        owner: new mongoose.Types.ObjectId().toString(),
        toString: () => goodId,
      };

      const createdAuction = {
        _id: new mongoose.Types.ObjectId().toString(),
        good: goodId,
        bidder: userId,
        bid,
        msg,
        createdAt: new Date(),
        populate: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId().toString(),
          good: goodId,
          bidder: { _id: userId, nick: "Test User" },
          bid,
          msg,
          createdAt: new Date(),
        }),
      };

      // 모킹 함수 구현
      (GoodModel.findById as jest.Mock).mockResolvedValue(good);
      (AuctionModel.findOne as jest.Mock).mockImplementation(() => ({
        sort: jest.fn().mockResolvedValue(null),
      }));
      (AuctionModel.create as jest.Mock).mockResolvedValue(createdAuction);

      // 함수 실행
      const result = await createBid(goodId, userId, bid, msg);

      // 검증
      expect(result.success).toBe(true);
      expect(AuctionModel.create).toHaveBeenCalledWith({
        good: goodId,
        bidder: userId,
        bid,
        msg,
      });
      expect(result.data).toBeDefined();
      expect(createdAuction.populate).toHaveBeenCalledWith("bidder", "nick");
    });

    it("should reject bid if good does not exist", async () => {
      // 존재하지 않는 상품 시나리오
      const goodId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      (GoodModel.findById as jest.Mock).mockResolvedValue(null);

      // 함수 실행
      const result = await createBid(goodId, userId, 1000);

      // 검증
      expect(result.success).toBe(false);
      expect(result.error).toBe("존재하지 않는 상품입니다");
      expect(AuctionModel.create).not.toHaveBeenCalled();
    });

    // 추가 테스트 케이스들 (시간 초과, 입찰가 부족 등) 생략...
  });
});
