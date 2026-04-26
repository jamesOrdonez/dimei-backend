const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const Tool = require("./Tool");

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

ToolUnitOfMeasure.hasMany(Tool, { foreignKey: "unitOfMeasure", as: "tools" });
Tool.belongsTo(ToolUnitOfMeasure, { foreignKey: "unitOfMeasure", as: "ToolUnitOfMeasure" });

module.exports = ToolUnitOfMeasure;
