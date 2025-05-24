const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 기본 라우트
app.get("/", (req, res) => {
  res.json({ message: "Welcome to 뚜따 Backend API" });
});

// API 라우트
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from 뚜따 Backend!" });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
