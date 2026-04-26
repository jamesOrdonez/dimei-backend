const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const ToolGroup = sequelize.define(
    "ToolGroup",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false },
        state: { type: DataTypes.STRING, allowNull: false },
        company: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
        tableName: "tool_group",
        timestamps: false,
    }
);

module.exports = ToolGroup;
