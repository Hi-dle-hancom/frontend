const fs = require("fs");
const path = require("path");
const readline = require("readline");
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

// 메모 디렉토리 설정 (파일 저장용)
const MEMO_DIR = path.join(process.cwd(), "memos");

// 메모 디렉토리가 없으면 생성
if (!fs.existsSync(MEMO_DIR)) {
  fs.mkdirSync(MEMO_DIR, { recursive: true });
  console.log(`메모 디렉토리 생성됨: ${MEMO_DIR}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 메인 메뉴 표시
function showMainMenu() {
  console.log("\n===== 간단한 메모장 =====");
  console.log("1. 새 메모 작성");
  console.log("2. 메모 목록 보기");
  console.log("3. 메모 읽기");
  console.log("4. 종료");
  rl.question("원하는 작업을 선택하세요 (1-4): ", handleMenuChoice);
}

// 메뉴 선택 처리
function handleMenuChoice(choice) {
  switch (choice) {
    case "1":
      createNewMemo();
      break;
    case "2":
      showMemoList();
      break;
    case "3":
      readMemo();
      break;
    case "4":
      console.log("메모장을 종료합니다.");
      rl.close();
      break;
    default:
      console.log("잘못된 선택입니다. 1-4 사이의 숫자를 입력하세요.");
      showMainMenu();
  }
}

// 새 메모 작성
async function createNewMemo() {
  console.log("\n===== 메모 목록 =====");
  console.log("1. 데이터베이스");
  console.log("2. 클라우드");

  rl.question("메모 제목을 입력하세요: ", (category) => {
    let categoryName;
    if (category === "1") {
      categoryName = "데이터베이스";
    } else if (category === "2") {
      categoryName = "클라우드";
    } else {
      categoryName = category;
    }

    rl.question(`메모 내용을 입력하세요: `, async (content) => {
      try {
        // DB에 메모 저장
        await pool.query(
          "INSERT INTO memos (category, content) VALUES (?, ?)",
          [categoryName, content]
        );
        console.log(`메모가 데이터베이스에 저장되었습니다.`);
      } catch (error) {
        console.error("메모 저장 실패:", error);
      }
      showMainMenu();
    });
  });
}

// 메모 목록 보기
async function showMemoList() {
  console.log("\n===== 메모 목록 =====");
  console.log("1. 데이터베이스");
  console.log("2. 클라우드");

  rl.question("원하는 메모 분류를 선택하세요: ", async (category) => {
    let searchTerm;
    if (category === "1") {
      searchTerm = "데이터베이스";
    } else if (category === "2") {
      searchTerm = "클라우드";
    } else {
      searchTerm = category;
    }

    try {
      // DB에서 메모 목록 조회
      const [rows] = await pool.query(
        "SELECT * FROM memos WHERE category = ? ORDER BY created_at DESC",
        [searchTerm]
      );

      if (rows.length === 0) {
        console.log(`${searchTerm} 분류의 메모가 없습니다.`);
      } else {
        rows.forEach((memo, index) => {
          // 파일명에서 ERD나 스키마 같은 내용이 있으면 함께 표시
          let suffix = "";
          if (memo.content.includes("ERD")) {
            suffix = "작성";
          } else if (memo.content.includes("RDS")) {
            suffix = "설정";
          }
          console.log(
            `${index + 1}. [${memo.created_at.toLocaleString()}] ${
              memo.category
            } ${suffix}`
          );
        });
      }
    } catch (error) {
      console.error("메모 목록 조회 실패:", error);
    }
    showMainMenu();
  });
}

// 메모 읽기
async function readMemo() {
  console.log("\n===== 메모 선택 =====");
  console.log("1. 데이터베이스");
  console.log("2. 클라우드");

  rl.question("읽을 메모 분류를 선택하세요: ", async (category) => {
    let searchTerm;
    if (category === "1") {
      searchTerm = "데이터베이스";
    } else if (category === "2") {
      searchTerm = "클라우드";
    } else {
      searchTerm = category;
    }

    try {
      // DB에서 메모 목록 조회
      const [rows] = await pool.query(
        "SELECT * FROM memos WHERE category = ? ORDER BY created_at DESC",
        [searchTerm]
      );

      if (rows.length === 0) {
        console.log(`${searchTerm} 분류의 메모가 없습니다.`);
        showMainMenu();
        return;
      }

      console.log(`\n===== ${searchTerm} =====`);
      rows.forEach((memo, index) => {
        // 파일명에서 ERD나 스키마 같은 내용이 있으면 함께 표시
        let suffix = "";
        if (memo.content.includes("ERD")) {
          suffix = "작성";
        } else if (memo.content.includes("RDS")) {
          suffix = "설정";
        }
        console.log(
          `${index + 1}. [${memo.created_at.toLocaleString()}] ${
            memo.category
          } ${suffix}`
        );
      });

      rl.question("읽을 메모 번호를 선택하세요: ", async (memoIndex) => {
        const index = parseInt(memoIndex) - 1;
        if (isNaN(index) || index < 0 || index >= rows.length) {
          console.log("잘못된 메모 번호입니다.");
        } else {
          const memo = rows[index];
          console.log(
            `\n===== ${
              memo.category
            } (${memo.created_at.toLocaleString()}) =====`
          );
          console.log(memo.content);
        }
        showMainMenu();
      });
    } catch (error) {
      console.error("메모 읽기 실패:", error);
      showMainMenu();
    }
  });
}

// 프로그램 종료 시 실행할 함수
rl.on("close", () => {
  console.log("프로그램을 종료합니다.");
  process.exit(0);
});

// 프로그램 시작
async function start() {
  try {
    // 시작 시 테이블 생성 확인
    await createTable();
    console.log("간단한 메모장 애플리케이션을 시작합니다...");
    showMainMenu();
  } catch (err) {
    console.error("시작 오류:", err);
    process.exit(1);
  }
}

// 프로그램 실행
start();
