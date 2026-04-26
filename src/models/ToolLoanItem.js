const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const ToolLoanItem = sequelize.define("ToolLoanItem", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tool_loan_id: { type: DataTypes.INTEGER, allowNull: false },
    tool_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1 },
}, {
    tableName: "tool_loan_item",
    timestamps: false,
});

const ToolLoan = require("./ToolLoan");
const Tool = require("./Tool");

ToolLoan.hasMany(ToolLoanItem, { foreignKey: "tool_loan_id", as: "loanItems" });
ToolLoanItem.belongsTo(ToolLoan, { foreignKey: "tool_loan_id", as: "toolLoan" });
ToolLoanItem.belongsTo(Tool, { foreignKey: "tool_id", as: "tool" });

module.exports = ToolLoanItem;
