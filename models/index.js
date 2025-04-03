const Sequelize = require("sequelize");

// 환경 변수 설정
const env = process.env.NODE_ENV || "development";

// RDS 데이터베이스 설정
const config = {
  development: {
    username: process.env.RDS_USERNAME || "admin",
    password: process.env.RDS_PASSWORD || "lds*13041226",
    database: process.env.RDS_DB_NAME || "userdb",
    host:
      process.env.RDS_HOSTNAME ||
      "hancom2.cv88qo4gg15o.ap-northeast-2.rds.amazonaws.com",
    dialect: "mysql",
    port: process.env.RDS_PORT || 3306,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
    },
    logging: console.log,
  },
};

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(
  config[env].database,
  config[env].username,
  config[env].password,
  config[env]
);

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.User = require("./user")(sequelize, Sequelize);

module.exports = db;
