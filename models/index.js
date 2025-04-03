const Sequelize = require("sequelize");

const env = process.env.NODE_ENV || "development";
const config = {
  development: {
    username: "admin",
    password: "lds*13041226",
    database: "userdb",
    host: "hancom2.cv88qo4gg15o.ap-northeast-2.rds.amazonaws.com",
    dialect: "mysql",
    port: 3306,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};

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
