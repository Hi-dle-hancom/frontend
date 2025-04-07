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
app.set("port", process.env.PORT || 8010);
app.set("view engine", "html");
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
    const isConnected = await connect();
    if (!isConnected) {
      console.error("MongoDB 연결 실패로 애플리케이션을 종료합니다.");
      console.error("MongoDB가 실행 중인지 확인하세요.");
      console.error("mongod --dbpath=./data");
      // process.exit(1);
    }
  } catch (err) {
    console.error("MongoDB 연결 도중 예외 발생:", err);
  }
})();

const sessionMiddleware = session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24, // 24시간
  },
});

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
// uploads 디렉토리 절대 경로 설정
const uploadsDir = path.join(__dirname, "uploads");
console.log("uploads 디렉토리 경로:", uploadsDir); // 경로 로깅
app.use("/img", express.static(uploadsDir));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);

app.use("/", indexRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

const server = app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});

webSocket(server, app, sessionMiddleware);
