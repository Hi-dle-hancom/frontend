module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        comment: "사용자 ID",
      },
      name: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "사용자 이름",
      },
      age: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "나이",
      },
      married: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        comment: "결혼 여부",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "생성 일시",
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "수정 일시",
      },
    },
    {
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      modelName: "User",
      tableName: "userm",
      charset: "utf8",
      collate: "utf8_general_ci",
      hooks: {
        beforeCreate: (user, options) => {
          const now = new Date();
          user.created_at = now;
          user.updated_at = now;
        },
        beforeUpdate: (user, options) => {
          user.updated_at = new Date();
        },
      },
    }
  );

  // 테이블 존재 확인 및 생성 함수
  User.checkAndCreateTable = async function (options) {
    try {
      // 테이블 존재 여부 확인
      const tableExists = await sequelize
        .getQueryInterface()
        .showAllTables()
        .then((tables) => tables.includes("userm"));

      if (!tableExists) {
        console.log("userm 테이블이 존재하지 않아 새로 생성합니다.");

        // 직접 SQL 쿼리로 테이블 생성
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS userm (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(20) NOT NULL,
            age INT UNSIGNED NOT NULL,
            married BOOLEAN NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL
          ) CHARACTER SET utf8 COLLATE utf8_general_ci;
        `);

        console.log("userm 테이블이 성공적으로 생성되었습니다.");
      } else {
        console.log("userm 테이블이 이미 존재합니다.");
      }

      return Promise.resolve();
    } catch (error) {
      console.error("테이블 동기화 중 오류 발생:", error);
      throw error;
    }
  };

  return User;
};
