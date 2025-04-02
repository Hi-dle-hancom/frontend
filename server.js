const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 보안 미들웨어 설정
app.use(helmet());

// 요청 제한 설정
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 15분 동안 최대 100개 요청
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// RDS 데이터베이스 설정
const dbConfig = {
  host:
    process.env.RDS_HOSTNAME ||
    "hancom.cv88qo4gg15o.ap-northeast-2.rds.amazonaws.com",
  user: process.env.RDS_USERNAME || "admin",
  password: process.env.RDS_PASSWORD || "lds*13041226",
  database: process.env.RDS_DB_NAME || "userdb",
  port: process.env.RDS_PORT || 3000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// 데이터베이스 연결 풀 생성
let pool;

// 데이터베이스 연결 및 초기화
async function initializeDatabase() {
  try {
    // 데이터베이스 연결 풀 생성
    pool = mysql.createPool(dbConfig);

    // 연결 테스트
    const connection = await pool.getConnection();
    console.log("Successfully connected to RDS database.");

    // 사용자 테이블 생성
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        full_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    connection.release();
    console.log("Database initialization completed");
    return pool;
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  }
}

// 인증 미들웨어
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication token is required." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token." });
    }
    req.user = user;
    next();
  });
}

// 라우트 설정
async function setupRoutes(pool) {
  // 사용자 등록
  app.post("/api/users/register", async (req, res) => {
    const { username, email, password, full_name } = req.body;

    // 유효성 검사
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required." });
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    try {
      // 중복 사용자 확인
      const [existingUsers] = await pool.query(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        [username, email]
      );

      if (existingUsers.length > 0) {
        return res
          .status(409)
          .json({ error: "Username or email already in use." });
      }

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 10);

      // 사용자 등록
      const [result] = await pool.query(
        "INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, full_name || ""]
      );

      const [newUser] = await pool.query(
        "SELECT id, username, email, full_name, created_at FROM users WHERE id = ?",
        [result.insertId]
      );

      res.status(201).json({
        message: "User registered successfully.",
        user: newUser[0],
      });
    } catch (err) {
      console.error("User registration error:", err);
      res
        .status(500)
        .json({ error: "An error occurred while registering the user." });
    }
  });

  // 로그인
  app.post("/api/users/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }

    try {
      // 사용자 찾기
      const [users] = await pool.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: "Authentication failed." });
      }

      const user = users[0];

      // 비밀번호 확인
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: "Authentication failed." });
      }

      // JWT 토큰 생성
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        message: "Login successful.",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "An error occurred during login." });
    }
  });

  // 사용자 프로필 조회
  app.get("/api/users/profile", authenticateToken, async (req, res) => {
    try {
      const [users] = await pool.query(
        "SELECT id, username, email, full_name, created_at FROM users WHERE id = ?",
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: "User not found." });
      }

      res.json(users[0]);
    } catch (err) {
      console.error("Profile fetch error:", err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching the profile." });
    }
  });

  // 사용자 정보 수정
  app.put("/api/users/profile", authenticateToken, async (req, res) => {
    const { email, full_name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    try {
      // 이메일 중복 확인 (다른 사용자)
      const [existingUsers] = await pool.query(
        "SELECT * FROM users WHERE email = ? AND id != ?",
        [email, req.user.id]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({ error: "Email already in use." });
      }

      // 사용자 정보 업데이트
      await pool.query(
        "UPDATE users SET email = ?, full_name = ? WHERE id = ?",
        [email, full_name || "", req.user.id]
      );

      const [updatedUser] = await pool.query(
        "SELECT id, username, email, full_name, created_at FROM users WHERE id = ?",
        [req.user.id]
      );

      res.json({
        message: "Profile updated successfully.",
        user: updatedUser[0],
      });
    } catch (err) {
      console.error("Profile update error:", err);
      res
        .status(500)
        .json({ error: "An error occurred while updating the profile." });
    }
  });

  // 비밀번호 변경
  app.put("/api/users/password", authenticateToken, async (req, res) => {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res
        .status(400)
        .json({ error: "Current and new passwords are required." });
    }

    try {
      // 현재 사용자 정보 가져오기
      const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [
        req.user.id,
      ]);

      if (users.length === 0) {
        return res.status(404).json({ error: "User not found." });
      }

      const user = users[0];

      // 현재 비밀번호 확인
      const passwordMatch = await bcrypt.compare(
        current_password,
        user.password
      );

      if (!passwordMatch) {
        return res
          .status(401)
          .json({ error: "Current password is incorrect." });
      }

      // 새 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // 비밀번호 업데이트
      await pool.query("UPDATE users SET password = ? WHERE id = ?", [
        hashedPassword,
        req.user.id,
      ]);

      res.json({ message: "Password changed successfully." });
    } catch (err) {
      console.error("Password change error:", err);
      res
        .status(500)
        .json({ error: "An error occurred while changing the password." });
    }
  });

  // 기본 라우트
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

  // 404 처리
  app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "index.html"));
  });
}

// 애플리케이션 종료 시 데이터베이스 연결 종료
process.on("SIGINT", () => {
  if (pool) {
    console.log("Closing database connection...");
    pool.end();
  }
  process.exit(0);
});

// 서버 시작
async function startServer() {
  try {
    const pool = await initializeDatabase();
    await setupRoutes(pool);

    app.listen(PORT, () => {
      console.log(
        `User registration server is running at http://localhost:${PORT}`
      );
    });
  } catch (err) {
    console.error("Server start failed:", err);
    process.exit(1);
  }
}

startServer();
