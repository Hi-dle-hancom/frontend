module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "User",
    {
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
    },
    {
      timestamps: true,
      paranoid: true,
      underscored: false,
      modelName: "User",
      tableName: "userm",
      charset: "utf8",
      collate: "utf8_general_ci",
    }
  );
};
