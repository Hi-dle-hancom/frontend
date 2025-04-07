const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const {
  renderMain,
  renderJoin,
  renderGood,
  createGood,
  renderAuction,
  bid,
  renderList,
  removeGood,
} = require("../controllers");
const { login, join, logout } = require("../controllers/auth");
const router = express.Router();

// 로그인 체크 미들웨어
router.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// uploads 디렉토리 생성
try {
  fs.readdirSync("uploads");
} catch (error) {
  console.error("uploads 폴더가 없어 uploads 폴더를 생성합니다.");
  fs.mkdirSync("uploads");
}

// 파일 업로드 설정
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, "uploads/");
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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
router.post("/good", isLoggedIn, upload.single("img"), createGood);

// 경매 조회
router.get("/good/:id", renderAuction);

// 입찰
router.post(
  "/good/:id/bid",
  isLoggedIn,
  express.urlencoded({ extended: false }),
  bid
);

// 내 경매 목록
router.get("/list", renderList);

// 경매 삭제
router.delete("/good/:id", isLoggedIn, removeGood);

module.exports = router;
