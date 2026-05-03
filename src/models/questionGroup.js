const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const QuestionGroup = sequelize.define(
  "QuestionGroup",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    company: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "question_group", timestamps: false }
);

module.exports = QuestionGroup;
