const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const Proyect = require("./proyect");
const User = require("./user");

const MaintenanceReport = sequelize.define(
  "MaintenanceReport",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    project_id: { type: DataTypes.INTEGER, allowNull: false },
    technician_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    customer_signature: { type: DataTypes.TEXT("long"), allowNull: false },
    customer_name: { type: DataTypes.STRING(150), allowNull: true },
    technician_signature: { type: DataTypes.TEXT("long"), allowNull: false },
    status: { type: DataTypes.STRING(20), defaultValue: "Finalizado" },
    pdf_path: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: "maintenance_report", timestamps: true }
);

/* ================= RELACIONES ================= */

MaintenanceReport.belongsTo(Proyect, { foreignKey: "project_id", as: "projectData" });
MaintenanceReport.belongsTo(User, { foreignKey: "technician_id", as: "technicianData" });
const MaintenanceAnswer = require("./maintenanceAnswer");
MaintenanceReport.hasMany(MaintenanceAnswer, { foreignKey: "maintenance_report_id", as: "answers" });
MaintenanceAnswer.belongsTo(MaintenanceReport, { foreignKey: "maintenance_report_id" });

// We define the inverse association here to avoid circular dependency in Proyect.js
Proyect.hasMany(MaintenanceReport, { foreignKey: "project_id", as: "maintenances" });

module.exports = MaintenanceReport;
