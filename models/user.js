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
      underscored: false,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      modelName: "User",
      tableName: "userm",
      charset: "utf8",
      collate: "utf8_general_ci",
      hooks: {
        beforeCreate: (user, options) => {
          user.created_at = new Date();
          user.updated_at = new Date();
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
      const tableExists = await sequelize
        .getQueryInterface()
        .showAllTables()
        .then((tables) => tables.includes("userm"));

      if (!tableExists) {
        console.log("userm 테이블이 존재하지 않아 새로 생성합니다.");
        return sequelize.getQueryInterface().createTable("userm", {
          id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          name: {
            type: DataTypes.STRING(20),
            allowNull: false,
          },
          age: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
          },
          married: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
          deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
          },
        });
      }

      return Promise.resolve();
    } catch (error) {
      console.error("테이블 동기화 중 오류 발생:", error);
      throw error;
    }
  };

  return User;
};
