const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 제공
app.use(express.static(__dirname));

// 기본 라우트
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`http://localhost:${PORT} 에서 접속 가능합니다.`);
});
