import { Response, NextFunction } from "express";
import {
  getAllActiveGoods,
  getGoodById,
  getGoodsByUserId,
  createGood,
  createBid,
  removeGood,
} from "../services";
import { AuthRequest } from "../types";

/**
 * 메인 페이지 렌더링 컨트롤러
 */
export const renderMain = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 모든 활성 상품 조회
    const result = await getAllActiveGoods();

    return res.render("main", {
      title: "경매 메인",
      newGoods: result.success ? result.data : [],
      user: req.session.user,
      loginError: req.query.loginError,
    });
  } catch (error) {
    console.error("메인 페이지 렌더링 오류:", error);
    next(error);
  }
};

/**
 * 회원가입 페이지 렌더링 컨트롤러
 */
export const renderJoin = (req: AuthRequest, res: Response) => {
  return res.render("join", {
    title: "회원가입",
    error: req.query.error,
    user: req.session.user,
  });
};

/**
 * 경매 등록 페이지 렌더링 컨트롤러
 */
export const renderGood = (req: AuthRequest, res: Response) => {
  return res.render("good", {
    title: "경매 등록",
    user: req.session.user,
  });
};

/**
 * 상품 생성 컨트롤러
 */
export const createGoodController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 요청에서 필요한 데이터 추출
    const { name, price, endTime } = req.body;
    const userId = req.session.user?.id;

    if (!userId) {
      return res.redirect("/?loginError=로그인이 필요합니다");
    }

    // 서비스 레이어를 통해 상품 생성
    const result = await createGood({
      name,
      price: parseInt(price, 10),
      img: req.file ? req.file.filename : undefined,
      endTime: new Date(endTime),
      owner: userId,
    });

    if (!result.success) {
      // 오류가 발생한 경우 오류 메시지와 함께 등록 페이지로 리다이렉트
      return res.redirect(
        `/good?error=${encodeURIComponent(result.error || "상품 등록 실패")}`,
      );
    }

    // Socket.IO를 통해 새 상품 등록 이벤트 발생
    const io = req.app.get("io");
    io.emit("newGood", { good: result.data });

    // 성공하면, 메인 페이지로 리다이렉트
    return res.redirect("/");
  } catch (error) {
    console.error("상품 생성 오류:", error);
    next(error);
  }
};

/**
 * 경매 상세 페이지 렌더링 컨트롤러
 */
export const renderAuction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // 서비스 레이어를 통해 상품 상세 정보 조회
    const result = await getGoodById(id);

    if (!result.success) {
      return res.status(404).send(result.error || "존재하지 않는 경매입니다");
    }

    const { good, auctions } = result.data;

    // 사용자가 상품 소유자인지 확인
    const goodOwnerId = good.owner._id ? good.owner._id.toString() : "";

    return res.render("auction", {
      title: `${good.name} - 경매`,
      good,
      auctions,
      user: req.session.user,
      goodOwnerId,
    });
  } catch (error) {
    console.error("경매 상세 페이지 렌더링 오류:", error);
    next(error);
  }
};

/**
 * 입찰 컨트롤러
 */
export const bid = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bid, msg } = req.body;
    const { id } = req.params;
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(403).send("로그인이 필요합니다");
    }

    // 서비스 레이어를 통해 입찰 생성
    const result = await createBid(id, userId, parseInt(bid, 10), msg);

    if (!result.success) {
      return res.status(403).send(result.error);
    }

    // Socket.IO를 통해 입찰 이벤트 발생
    const io = req.app.get("io");
    io.of("/auction")
      .to(id)
      .emit("bid", {
        bid: result.data?.bid,
        msg: result.data?.msg,
        nick: (result.data?.bidder as any).nick,
        date: result.data?.createdAt,
      });

    return res.send("ok");
  } catch (error) {
    console.error("입찰 오류:", error);
    next(error);
  }
};

/**
 * 내 경매 목록 페이지 렌더링 컨트롤러
 */
export const renderList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    let goods = [];

    // 로그인한 경우 사용자의 경매 목록 조회
    if (req.session.user) {
      const result = await getGoodsByUserId(req.session.user.id);
      if (result.success) {
        goods = result.data;
      }
    } else {
      // 로그인하지 않은 경우 모든 활성화된 경매 목록 조회
      const result = await getAllActiveGoods();
      if (result.success) {
        goods = result.data;
      }
    }

    return res.render("list", {
      title: "경매 목록",
      goods,
      user: req.session.user,
    });
  } catch (error) {
    console.error("경매 목록 페이지 렌더링 오류:", error);
    next(error);
  }
};

/**
 * 경매 삭제 컨트롤러
 */
export const removeGoodController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(403).send("로그인이 필요합니다");
    }

    // 상품 정보 조회 (소유자 확인용)
    const goodResult = await getGoodById(id);
    if (!goodResult.success) {
      return res
        .status(404)
        .send(goodResult.error || "존재하지 않는 경매입니다");
    }

    const good = goodResult.data.good;
    const goodOwnerId = good.owner._id ? good.owner._id.toString() : "";

    // 소유자인지 확인
    if (goodOwnerId !== userId) {
      return res.status(403).send("권한이 없습니다");
    }

    // 서비스 레이어를 통해 상품 삭제
    const result = await removeGood(id);

    if (!result.success) {
      return res.status(500).send(result.error || "경매 삭제 실패");
    }

    return res.send("ok");
  } catch (error) {
    console.error("경매 삭제 오류:", error);
    next(error);
  }
};
