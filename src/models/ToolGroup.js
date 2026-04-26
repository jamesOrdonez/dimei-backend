const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const Tool = require("./Tool");

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

ToolGroup.hasMany(Tool, { foreignKey: "group_item", as: "tools" });
Tool.belongsTo(ToolGroup, { foreignKey: "group_item", as: "ToolGroup" });

module.exports = ToolGroup;
