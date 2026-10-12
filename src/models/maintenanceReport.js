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
    maintenance_type: { type: DataTypes.STRING(50), allowNull: true, defaultValue: "Preventivo" },
    recommendations: { type: DataTypes.JSON, allowNull: true },
    pdf_path: { type: DataTypes.STRING(255), allowNull: true },
    general_observations: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "maintenance_report", timestamps: true }
);

// Auto-ensure general_observations exists in maintenance_report table and remove restrictive question_id FK
sequelize.authenticate().then(async () => {
  try {
    const [cols] = await sequelize.query("SHOW COLUMNS FROM maintenance_report LIKE 'general_observations'");
    if (cols && cols.length === 0) {
      await sequelize.query("ALTER TABLE maintenance_report ADD COLUMN general_observations TEXT NULL");
      console.log("Column general_observations added to maintenance_report table");
    }

    // Remover restricción de clave foránea en maintenance_answer(question_id) para permitir preguntas personalizadas/emergencia
    try {
      const [fkRows] = await sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'maintenance_answer' 
          AND COLUMN_NAME = 'question_id' 
          AND REFERENCED_TABLE_NAME = 'question'
      `);
      for (const row of fkRows) {
        if (row.CONSTRAINT_NAME) {
          await sequelize.query(`ALTER TABLE maintenance_answer DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``);
          console.log(`Foreign key ${row.CONSTRAINT_NAME} eliminada de maintenance_answer`);
        }
      }
    } catch (fkErr) {
      // Fallback directo por si el nombre es fijo
      try {
        await sequelize.query("ALTER TABLE maintenance_answer DROP FOREIGN KEY `maintenance_answer_ibfk_2`");
        console.log("Foreign key maintenance_answer_ibfk_2 eliminada directamente de maintenance_answer");
      } catch (e) {}
    }
  } catch (err) {
    console.error("Error ensuring maintenance tables schema:", err.message);
  }
}).catch(() => {});

/* ================= RELACIONES ================= */

MaintenanceReport.belongsTo(Proyect, { foreignKey: "project_id", as: "projectData" });
MaintenanceReport.belongsTo(User, { foreignKey: "technician_id", as: "technicianData" });
const MaintenanceAnswer = require("./maintenanceAnswer");
MaintenanceReport.hasMany(MaintenanceAnswer, { foreignKey: "maintenance_report_id", as: "answers" });
MaintenanceAnswer.belongsTo(MaintenanceReport, { foreignKey: "maintenance_report_id" });

// We define the inverse association here to avoid circular dependency in Proyect.js
Proyect.hasMany(MaintenanceReport, { foreignKey: "project_id", as: "maintenances" });

module.exports = MaintenanceReport;
