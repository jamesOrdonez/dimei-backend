const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const ToolLoanStatusHistory = sequelize.define("ToolLoanStatusHistory", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tool_loan_id: { type: DataTypes.INTEGER, allowNull: false },
    tool_id: { type: DataTypes.INTEGER, allowNull: true },
    qty: { type: DataTypes.FLOAT, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false },
    observations: { type: DataTypes.TEXT, allowNull: true },
    changed_by: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
}, {
    tableName: "tool_loan_status_history",
    timestamps: false,
});

const ToolLoan = require("./ToolLoan");
const User = require("./user");

ToolLoan.hasMany(ToolLoanStatusHistory, { foreignKey: "tool_loan_id", as: "statusHistory" });
ToolLoanStatusHistory.belongsTo(ToolLoan, { foreignKey: "tool_loan_id", as: "toolLoan" });
ToolLoanStatusHistory.belongsTo(User, { foreignKey: "changed_by", as: "ChangedBy" });

module.exports = ToolLoanStatusHistory;
