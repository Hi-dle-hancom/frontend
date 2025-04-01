const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// SQLite 데이터베이스 파일 경로
const dbPath = path.join(__dirname, "memos.db");

// 데이터베이스 연결 및 초기화
async function initializeDatabase() {
  try {
    // 데이터베이스 연결
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // 테이블 생성
    await db.exec(`
      CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("데이터베이스 초기화 완료");
    return db;
  } catch (err) {
    console.error("데이터베이스 초기화 실패:", err);
    throw err;
  }
}

// 라우트 설정
async function setupRoutes(db) {
  // 모든 메모 조회
  app.get("/api/memos", async (req, res) => {
    try {
      const memos = await db.all(
        "SELECT * FROM memos ORDER BY created_at DESC"
      );
      res.json(memos);
    } catch (err) {
      console.error("메모 조회 오류:", err);
      res.status(500).json({ error: "메모 조회 중 오류가 발생했습니다." });
    }
  });

  // 특정 메모 조회
  app.get("/api/memos/:id", async (req, res) => {
    try {
      const memo = await db.get("SELECT * FROM memos WHERE id = ?", [
        req.params.id,
      ]);
      if (memo) {
        res.json(memo);
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
      const result = await db.run(
        "INSERT INTO memos (title, content) VALUES (?, ?)",
        [title, content]
      );

      const newMemo = await db.get("SELECT * FROM memos WHERE id = ?", [
        result.lastID,
      ]);
      res.status(201).json(newMemo);
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
      await db.run("UPDATE memos SET title = ?, content = ? WHERE id = ?", [
        title,
        content,
        req.params.id,
      ]);

      const updatedMemo = await db.get("SELECT * FROM memos WHERE id = ?", [
        req.params.id,
      ]);
      if (updatedMemo) {
        res.json(updatedMemo);
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
      const result = await db.run("DELETE FROM memos WHERE id = ?", [
        req.params.id,
      ]);

      if (result.changes > 0) {
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

// 서버 시작
async function startServer() {
  try {
    const db = await initializeDatabase();
    await setupRoutes(db);

    app.listen(PORT, () => {
      console.log(`메모 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    });
  } catch (err) {
    console.error("서버 시작 실패:", err);
    process.exit(1);
  }
}

startServer();
