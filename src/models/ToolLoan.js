const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const ToolLoan = sequelize.define("ToolLoan", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    borrower_user_id: { type: DataTypes.INTEGER, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    observations: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Prestado' },
    company: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
}, {
    tableName: "tool_loan",
    timestamps: false,
});

const User = require("./user");
ToolLoan.belongsTo(User, { foreignKey: "borrower_user_id", as: "BorrowerUser" });
ToolLoan.belongsTo(User, { foreignKey: "created_by", as: "CreatedBy" });

module.exports = ToolLoan;
