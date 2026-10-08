const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

// Pivote N:M entre equipos (proyect) y grupos de preguntas de mantenimiento
const ProjectQuestionGroup = sequelize.define(
  "ProjectQuestionGroup",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    proyect_id: { type: DataTypes.INTEGER, allowNull: false },
    question_group_id: { type: DataTypes.INTEGER, allowNull: false },
    sort_order: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  },
  { tableName: "proyect_question_group", timestamps: false }
);

module.exports = ProjectQuestionGroup;
