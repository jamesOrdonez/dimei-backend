const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const MaintenanceAnswer = sequelize.define(
  "MaintenanceAnswer",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    maintenance_report_id: { type: DataTypes.INTEGER, allowNull: false },
    question_id: { type: DataTypes.INTEGER, allowNull: false },
    answer_text: { type: DataTypes.TEXT, allowNull: true },
    selected_options: { type: DataTypes.JSON, allowNull: true }, // [optionId1, optionId2]
    photos: { type: DataTypes.JSON, allowNull: true }, // [path1, path2]
  },
  { tableName: "maintenance_answer", timestamps: false }
);

module.exports = MaintenanceAnswer;
