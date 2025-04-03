const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { sequelize } = require("./models");

const app = express();
const port = 3200;

// 시퀄라이즈 연결 동기화
console.log(
  "RDS 데이터베이스(hancom2.cv88qo4gg15o.ap-northeast-2.rds.amazonaws.com) 연결 시도 중..."
);
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("RDS 데이터베이스 연결 성공 - userdb.userm 테이블");
  })
  .catch((err) => {
    console.error("RDS 데이터베이스 연결 실패:", err);
    console.log("데이터베이스 연결 없이 서버를 계속 실행합니다.");
  });

// 미들웨어 설정
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다`);
});
