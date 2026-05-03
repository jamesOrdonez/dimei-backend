const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const AnswerOption = sequelize.define(
  "AnswerOption",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    question_id: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.STRING(200), allowNull: false },
    requires_photo: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
  },
  { tableName: "answer_option", timestamps: false }
);

module.exports = AnswerOption;
