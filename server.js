const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 3100;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 아바타 저장 디렉터리 설정
const avatarDir = path.join(__dirname, "avatars");
// 아바타 디렉터리 생성 (없는 경우)
(async () => {
  try {
    await fs.mkdir(avatarDir, { recursive: true });
    console.log("Avatar directory created or already exists");
  } catch (err) {
    console.error("Failed to create avatar directory:", err);
  }
})();

// multer 설정 (파일 업로드 처리)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// 보안 미들웨어 설정
app.use(helmet());

// 요청 제한 설정
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 15분 동안 최대 100개 요청
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// 아바타 정적 서빙
app.use("/avatars", express.static(avatarDir));

// RDS 데이터베이스 설정
const dbConfig = {
  host:
    process.env.RDS_HOSTNAME ||
    "hancom2.cv88qo4gg15o.ap-northeast-2.rds.amazonaws.com",
  user: process.env.RDS_USERNAME || "admin",
  password: process.env.RDS_PASSWORD || "lds*13041226",
  database: process.env.RDS_DB_NAME || "userdb",
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
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

// 관리자 권한 확인 미들웨어
async function isAdmin(req, res, next) {
  try {
    const [users] = await pool.query(
      "SELECT is_admin FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0 || !users[0].is_admin) {
      return res.status(403).json({ error: "Admin access required." });
    }

    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ error: "Failed to verify admin status." });
  }
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

    // 비밀번호 강도 검사
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long.",
      });
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
        "SELECT id, username, email, full_name, avatar_url, created_at FROM users WHERE id = ?",
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
    const { username, password, remember_me } = req.body;

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

      // JWT 토큰 생성 (기억하기 옵션에 따라 만료 시간 설정)
      const expiresIn = remember_me ? "7d" : "1h";

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn }
      );

      res.json({
        message: "Login successful.",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
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
        "SELECT id, username, email, full_name, avatar_url, created_at FROM users WHERE id = ?",
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
        "SELECT id, username, email, full_name, avatar_url, created_at FROM users WHERE id = ?",
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

  // 아바타 업로드
  app.post(
    "/api/users/avatar",
    authenticateToken,
    upload.single("avatar"),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: "No avatar file uploaded." });
      }

      try {
        // 이전 아바타 파일 정보 가져오기
        const [userData] = await pool.query(
          "SELECT avatar_url FROM users WHERE id = ?",
          [req.user.id]
        );

        const oldAvatarUrl = userData[0]?.avatar_url;

        // 새 아바타 URL 생성
        const avatarUrl = `/avatars/${req.file.filename}`;

        // 아바타 URL 업데이트
        await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [
          avatarUrl,
          req.user.id,
        ]);

        // 이전 아바타 파일 삭제 (기본 아바타가 아닌 경우)
        if (
          oldAvatarUrl &&
          !oldAvatarUrl.includes("default") &&
          oldAvatarUrl.startsWith("/avatars/")
        ) {
          const oldAvatarPath = path.join(__dirname, oldAvatarUrl);
          try {
            await fs.unlink(oldAvatarPath);
            console.log("Previous avatar deleted:", oldAvatarPath);
          } catch (unlinkErr) {
            console.error("Failed to delete previous avatar:", unlinkErr);
            // 파일 삭제 실패해도 진행
          }
        }

        // 업데이트된 사용자 정보 반환
        const [updatedUser] = await pool.query(
          "SELECT id, username, email, full_name, avatar_url, created_at FROM users WHERE id = ?",
          [req.user.id]
        );

        res.json({
          message: "Avatar uploaded successfully.",
          user: updatedUser[0],
        });
      } catch (err) {
        console.error("Avatar upload error:", err);
        res
          .status(500)
          .json({ error: "An error occurred while uploading the avatar." });
      }
    }
  );

  // 비밀번호 변경
  app.put("/api/users/password", authenticateToken, async (req, res) => {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res
        .status(400)
        .json({ error: "Current and new passwords are required." });
    }

    // 비밀번호 강도 검사
    if (new_password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long.",
      });
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

  // 모든 사용자 조회 (페이지네이션 및 검색 기능 포함)
  app.get("/api/users", authenticateToken, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || "";

      let query = `
        SELECT id, username, email, full_name, avatar_url, created_at 
        FROM users 
        WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const searchParam = `%${search}%`;

      const [users] = await pool.query(query, [
        searchParam,
        searchParam,
        searchParam,
        limit,
        offset,
      ]);

      // 전체 사용자 수 조회 (검색 조건 포함)
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM users 
         WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?`,
        [searchParam, searchParam, searchParam]
      );

      const totalUsers = countResult[0].total;
      const totalPages = Math.ceil(totalUsers / limit);

      res.json({
        users,
        pagination: {
          total: totalUsers,
          page,
          limit,
          totalPages,
        },
      });
    } catch (err) {
      console.error("Users list error:", err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching users." });
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
