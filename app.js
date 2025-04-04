const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const connectDB = require("./models/db");

const app = express();
const port = process.env.PORT || 3200;

// MongoDB 연결
connectDB();

// 미들웨어 설정
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 보안 미들웨어
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// 라우터 설정
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

app.use("/", indexRouter);
app.use("/users", usersRouter);

// 404 오류 처리
app.use((req, res, next) => {
  res.status(404).render("error", {
    message: "페이지를 찾을 수 없습니다",
    error: { status: 404 },
  });
});

// 오류 처리 미들웨어
app.use((err, req, res, next) => {
  console.error("애플리케이션 오류:", err);
  const status = err.status || 500;
  res.status(status).render("error", {
    message: err.message || "서버에 오류가 발생했습니다",
    error: {
      status: status,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    },
  });
});

// 서버 시작
app.listen(port, "0.0.0.0", () => {
  console.log(`서버가 http://0.0.0.0:${port} 에서 실행 중입니다`);
});
