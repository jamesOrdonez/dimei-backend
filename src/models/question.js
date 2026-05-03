const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const Question = sequelize.define(
  "Question",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    group_id: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.STRING(500), allowNull: false },
    type: {
      type: DataTypes.ENUM("unica", "multiple", "abierta", "fotos"),
      allowNull: false,
    },
    min_photos: { type: DataTypes.INTEGER, allowNull: true },
    max_photos: { type: DataTypes.INTEGER, allowNull: true },
    order: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  },
  { tableName: "question", timestamps: false }
);

module.exports = Question;
