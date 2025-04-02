const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ... existing code ...
const dbConfig = {
  host:
    process.env.RDS_HOSTNAME ||
    "hancom.cv88qo4gg15o.ap-northeast-2.rds.amazonaws.com",
  user: process.env.RDS_USERNAME || "admin",
  password: process.env.RDS_PASSWORD || "lds*13041226",
  database: process.env.RDS_DB_NAME || "memodb",
  port: process.env.RDS_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
// ... existing code ...

// 데이터베이스 연결 풀 생성
let pool;

// 데이터베이스 연결 및 초기화
async function initializeDatabase() {
  try {
    // 데이터베이스 연결 풀 생성
    pool = mysql.createPool(dbConfig);

    // 연결 테스트
    const connection = await pool.getConnection();
    console.log("RDS 데이터베이스에 성공적으로 연결되었습니다.");

    // 테이블 생성
    await connection.query(`
      CREATE TABLE IF NOT EXISTS memos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    connection.release();
    console.log("데이터베이스 초기화 완료");
    return pool;
  } catch (err) {
    console.error("데이터베이스 초기화 실패:", err);
    throw err;
  }
}

// 라우트 설정
async function setupRoutes(pool) {
  // 모든 메모 조회
  app.get("/api/memos", async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM memos ORDER BY created_at DESC"
      );
      res.json(rows);
    } catch (err) {
      console.error("메모 조회 오류:", err);
      res.status(500).json({ error: "메모 조회 중 오류가 발생했습니다." });
    }
  });

  // 특정 메모 조회
  app.get("/api/memos/:id", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM memos WHERE id = ?", [
        req.params.id,
      ]);

      if (rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.status(404).json({ error: "메모를 찾을 수 없습니다." });
      }
    } catch (err) {
      console.error("메모 조회 오류:", err);
      res.status(500).json({ error: "메모 조회 중 오류가 발생했습니다." });
    }
  });

  // 메모 생성
  app.post("/api/memos", async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "제목과 내용은 필수 입력 항목입니다." });
    }

    try {
      const [result] = await pool.query(
        "INSERT INTO memos (title, content) VALUES (?, ?)",
        [title, content]
      );

      const [newMemo] = await pool.query("SELECT * FROM memos WHERE id = ?", [
        result.insertId,
      ]);

      res.status(201).json(newMemo[0]);
    } catch (err) {
      console.error("메모 생성 오류:", err);
      res.status(500).json({ error: "메모 생성 중 오류가 발생했습니다." });
    }
  });

  // 메모 수정
  app.put("/api/memos/:id", async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "제목과 내용은 필수 입력 항목입니다." });
    }

    try {
      const [result] = await pool.query(
        "UPDATE memos SET title = ?, content = ? WHERE id = ?",
        [title, content, req.params.id]
      );

      if (result.affectedRows > 0) {
        const [updatedMemo] = await pool.query(
          "SELECT * FROM memos WHERE id = ?",
          [req.params.id]
        );
        res.json(updatedMemo[0]);
      } else {
        res.status(404).json({ error: "메모를 찾을 수 없습니다." });
      }
    } catch (err) {
      console.error("메모 수정 오류:", err);
      res.status(500).json({ error: "메모 수정 중 오류가 발생했습니다." });
    }
  });

  // 메모 삭제
  app.delete("/api/memos/:id", async (req, res) => {
    try {
      const [result] = await pool.query("DELETE FROM memos WHERE id = ?", [
        req.params.id,
      ]);

      if (result.affectedRows > 0) {
        res.json({ success: true, message: "메모가 삭제되었습니다." });
      } else {
        res.status(404).json({ error: "메모를 찾을 수 없습니다." });
      }
    } catch (err) {
      console.error("메모 삭제 오류:", err);
      res.status(500).json({ error: "메모 삭제 중 오류가 발생했습니다." });
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
    console.log("데이터베이스 연결 종료 중...");
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
      console.log(`메모 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    });
  } catch (err) {
    console.error("서버 시작 실패:", err);
    process.exit(1);
  }
}

startServer();
