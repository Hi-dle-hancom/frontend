import express from "express";
import { isLoggedIn, isNotLoggedIn, uploadMiddleware } from "../middlewares";
import {
  renderMain,
  renderJoin,
  renderGood,
  createGoodController,
  renderAuction,
  bid,
  renderList,
  removeGoodController,
  join,
  login,
  logout,
} from "../controllers";

const router = express.Router();

// 메인 페이지
router.get("/", renderMain);

// 회원가입
router.get("/join", isNotLoggedIn, renderJoin);
router.post("/auth/join", isNotLoggedIn, join);

// 로그인/로그아웃
router.post("/auth/login", isNotLoggedIn, login);
router.post("/login", isNotLoggedIn, login);
router.get("/logout", isLoggedIn, logout);

// 경매 등록
router.get("/good", isLoggedIn, renderGood);
router.post(
  "/good",
  isLoggedIn,
  uploadMiddleware.single("img"),
  createGoodController,
);

// 경매 조회
router.get("/good/:id", renderAuction);

// 입찰
router.post(
  "/good/:id/bid",
  isLoggedIn,
  express.urlencoded({ extended: false }),
  bid,
);

// 내 경매 목록
router.get("/list", renderList);

// 경매 삭제
router.delete("/good/:id", isLoggedIn, removeGoodController);

export default router;
