const express = require("express");
const path = require("path");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");

dotenv.config();
const webSocket = require("./socket");
const indexRouter = require("./routes");
const connect = require("./schemas");

const app = express();
app.set("port", process.env.PORT || 2000);
app.set("view engine", "html");
app.set("trust proxy", 1);

const env = nunjucks.configure("views", {
  express: app,
  watch: true,
});

// date 필터 추가
env.addFilter("date", function (date) {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(date).toLocaleString("ko-KR", options);
});

// MongoDB 연결 및 연결 실패 시 처리
(async () => {
  try {
    console.log("MongoDB 연결 시도 중...");
    const isConnected = await connect();
    if (!isConnected) {
      console.error("MongoDB 연결 실패로 애플리케이션을 종료합니다.");
      console.error("MongoDB가 실행 중인지 확인하세요.");
      console.error("MongoDB 연결 URI:", process.env.MONGODB_URI);
      process.exit(1);
    }
    console.log("MongoDB 연결 성공!");
  } catch (err) {
    console.error("MongoDB 연결 도중 예외 발생:", err);
    process.exit(1);
  }
})();

const sessionMiddleware = session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24,
  },
  proxy: true,
});

// 기본 미들웨어 설정
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

// uploads 디렉토리 생성 및 설정
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  console.log("uploads 디렉토리 생성");
  fs.mkdirSync(uploadsDir);
}
console.log("uploads 디렉토리 경로:", uploadsDir);
app.use("/img", express.static(uploadsDir));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);

// CORS 설정
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", true);

  // OPTIONS 요청 처리
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use("/", indexRouter);

// 404 에러 처리
app.use((req, res, next) => {
  console.log(`404 에러 발생: ${req.method} ${req.url}`);
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error("에러 발생:", err);
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

const server = app.listen(app.get("port"), "0.0.0.0", () => {
  console.log("서버가 시작되었습니다.");
  console.log(`서버 주소: http://${process.env.HOST}:${app.get("port")}`);
  console.log("환경:", process.env.NODE_ENV);
});

webSocket(server, app, sessionMiddleware);
