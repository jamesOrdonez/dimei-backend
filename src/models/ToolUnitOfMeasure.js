const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const ToolUnitOfMeasure = sequelize.define(
    "ToolUnitOfMeasure",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        unitOfMeasure: { type: DataTypes.STRING, allowNull: false },
        company: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
        tableName: "tool_unit_of_measure",
        timestamps: false,
    }
);

module.exports = ToolUnitOfMeasure;
