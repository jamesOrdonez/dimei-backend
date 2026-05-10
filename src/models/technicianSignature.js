const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const TechnicianSignature = sequelize.define(
  "TechnicianSignature",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    signature: { type: DataTypes.TEXT("long"), allowNull: false }, // Base64
    name: { type: DataTypes.STRING(100), allowNull: true },
  },
  { tableName: "technician_signature", timestamps: true }
);

module.exports = TechnicianSignature;
