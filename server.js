const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// 정적 파일 제공 - 현재 디렉토리에서 직접 제공
app.use(express.static(__dirname));

// 메인 라우트
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
