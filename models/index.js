const Sequelize = require("sequelize");

// 환경 변수 설정
const env = process.env.NODE_ENV || "development";

// RDS 데이터베이스 설정
const config = {
  development: {
    user: process.env.RDS_USERNAME || "admin",
    password: process.env.RDS_PASSWORD || "lds*13041226",
    database: process.env.RDS_DB_NAME || "userdb",
    host:
      process.env.RDS_HOSTNAME ||
      "hancom2.cv88qo4gg15o.ap-northeast-2.rds.amazonaws.com",
    dialect: "mysql",

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
    },
    logging: true,
    dialectOptions: {
      connectTimeout: 60000, // 1분 연결 타임아웃
    },
    retry: {
      max: 3, // 연결 재시도 횟수
    },
  },
};

console.log("데이터베이스 연결 정보:", {
  host: config[env].host,
  port: config[env].port,
  database: config[env].database,
  user: config[env].user,
});

// Sequelize 인스턴스 생성
let sequelize;
try {
  sequelize = new Sequelize(
    config[env].database,
    config[env].user,
    config[env].password,
    config[env]
  );
  console.log("Sequelize 인스턴스가 생성되었습니다.");
} catch (error) {
  console.error("Sequelize 인스턴스 생성 중 오류 발생:", error);
  process.exit(1);
}

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// 모델 정의
try {
  db.User = require("./user")(sequelize, Sequelize);
  console.log("User 모델이 정의되었습니다.");
} catch (error) {
  console.error("모델 정의 중 오류 발생:", error);
  process.exit(1);
}

// 데이터베이스 연결 테스트
sequelize
  .authenticate()
  .then(() => {
    console.log("데이터베이스 연결이 성공적으로 설정되었습니다.");
  })
  .catch((err) => {
    console.error("데이터베이스 연결 중 오류 발생:", err);
  });

module.exports = db;
