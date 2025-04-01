const http = require("http");
const fs = require("fs").promises;
const path = require("path");
const mysql = require("mysql2/promise");

// MySQL 연결 풀 생성
const pool = mysql.createPool({
  host: "hancom.cv88qo4gg15o.ap-northeast-2.rds.amazonaws.com",
  user: "root",
  password: "1234",
  database: "memodb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 테이블 생성 함수
async function createTable() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS memos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    connection.release();
    console.log("테이블 생성 완료");
  } catch (err) {
    console.error("테이블 생성 실패:", err);
  }
}

// 서버 생성
http
  .createServer(async (req, res) => {
    try {
      // CORS 허용
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      // preflight 요청 처리
      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // GET 요청 처리
      if (req.method === "GET") {
        if (req.url === "/") {
          // 메인 페이지 제공
          const data = await fs.readFile(path.join(__dirname, "index.html"));
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(data);
          return;
        } else if (req.url === "/memo.css") {
          // CSS 파일 제공
          const data = await fs.readFile(path.join(__dirname, "memo.css"));
          res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
          res.end(data);
          return;
        } else if (req.url === "/frontend_memo.js") {
          // 클라이언트 JS 파일 제공
          const data = await fs.readFile(
            path.join(__dirname, "frontend_memo.js")
          );
          res.writeHead(200, {
            "Content-Type": "application/javascript; charset=utf-8",
          });
          res.end(data);
          return;
        } else if (req.url === "/api/memos") {
          // 모든 메모 목록 조회
          const [rows] = await pool.query(
            "SELECT * FROM memos ORDER BY created_at DESC"
          );
          res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify(rows));
          return;
        } else if (req.url.startsWith("/api/memos/category/")) {
          // 카테고리별 메모 목록 조회
          const category = decodeURIComponent(
            req.url.split("/api/memos/category/")[1]
          );
          const [rows] = await pool.query(
            "SELECT * FROM memos WHERE category = ? ORDER BY created_at DESC",
            [category]
          );
          res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify(rows));
          return;
        } else if (req.url.startsWith("/api/memos/")) {
          // 특정 메모 조회
          const id = req.url.split("/api/memos/")[1];
          const [rows] = await pool.query("SELECT * FROM memos WHERE id = ?", [
            id,
          ]);

          if (rows.length > 0) {
            res.writeHead(200, {
              "Content-Type": "application/json; charset=utf-8",
            });
            res.end(JSON.stringify(rows[0]));
          } else {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("메모를 찾을 수 없습니다.");
          }
          return;
        }

        // 기타 요청은 404 응답
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("요청하신 페이지를 찾을 수 없습니다.");
        return;
      }

      // POST 요청 처리 (새 메모 생성)
      if (req.method === "POST" && req.url === "/api/memos") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });

        req.on("end", async () => {
          try {
            const { category, content } = JSON.parse(body);

            // 메모 저장
            const [result] = await pool.query(
              "INSERT INTO memos (category, content) VALUES (?, ?)",
              [category, content]
            );

            res.writeHead(201, {
              "Content-Type": "application/json; charset=utf-8",
            });
            res.end(JSON.stringify({ success: true, id: result.insertId }));
          } catch (err) {
            console.error("메모 저장 오류:", err);
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("메모 저장 중 오류가 발생했습니다.");
          }
        });
        return;
      }

      // DELETE 요청 처리 (메모 삭제)
      if (req.method === "DELETE" && req.url.startsWith("/api/memos/")) {
        const id = req.url.split("/api/memos/")[1];

        try {
          await pool.query("DELETE FROM memos WHERE id = ?", [id]);
          res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          console.error("메모 삭제 오류:", err);
          res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("메모 삭제 중 오류가 발생했습니다.");
        }
        return;
      }

      // 지원하지 않는 요청 메서드
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("지원하지 않는 요청 메서드입니다.");
    } catch (err) {
      console.error("서버 오류:", err);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("서버 오류가 발생했습니다.");
    }
  })
  .listen(3000, async () => {
    // 서버 시작 시 테이블 생성 확인
    await createTable();
    console.log("메모 서버가 3000번 포트에서 실행 중입니다.");
  });
