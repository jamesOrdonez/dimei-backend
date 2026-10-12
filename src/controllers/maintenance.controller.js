const httpStatus = require("http-status");
const MaintenanceReport = require("../models/maintenanceReport");
const MaintenanceAnswer = require("../models/maintenanceAnswer");
const Proyect = require("../models/proyect");
const User = require("../models/user");
const { base64ToFile } = require("../utils/fileUpload");

async function saveMaintenanceReport(req, res) {
  try {
    const { 
      project_id, 
      technician_id, 
      customer_signature, 
      technician_signature, 
      customer_name,
      maintenance_type,
      recommendations,
      general_observations,
      answers,
      pdf_base64
    } = req.body;

    // 1. Create Report
    const report = await MaintenanceReport.create({
      project_id,
      technician_id,
      customer_signature: base64ToFile(customer_signature, 'signatures'),
      technician_signature: base64ToFile(technician_signature, 'signatures'),
      customer_name: customer_name || null,
      maintenance_type: maintenance_type || 'Preventivo',
      recommendations: recommendations || [],
      general_observations: general_observations || '',
      pdf_path: base64ToFile(pdf_base64, 'maintenances'),
      date: new Date()
    });

    // 2. Create Answers
    if (answers && typeof answers === 'object') {
      const answerRecords = Object.entries(answers).map(([key, data]) => {
        // Support both naming conventions: frontend sends answer_text/selected_options,
        // but the original state structure used text/optionIds
        const answerText = data.answer_text ?? data.text ?? null;
        const selectedOptions = data.selected_options ?? data.optionIds ?? [];
        // Photos may arrive as base64 strings directly or as { preview: base64 } objects
        const rawPhotos = data.photos || [];
        const savedPhotos = rawPhotos.map(p => {
          const src = typeof p === 'string' ? p : p?.preview;
          return base64ToFile(src, 'maintenance');
        });

        return {
          maintenance_report_id: report.id,
          question_id: data.question_id || key,
          answer_text: answerText,
          selected_options: selectedOptions,
          photos: savedPhotos
        };
      });
      try {
        await MaintenanceAnswer.bulkCreate(answerRecords);
      } catch (insertError) {
        if (insertError.name === "SequelizeForeignKeyConstraintError" || insertError.parent?.errno === 1452) {
          const sequelize = require("../db/conection");
          try {
            await sequelize.query("ALTER TABLE maintenance_answer DROP FOREIGN KEY `maintenance_answer_ibfk_2`");
          } catch (e) {
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
                }
              }
            } catch (err2) {}
          }
          // Reintentar inserción
          await MaintenanceAnswer.bulkCreate(answerRecords);
        } else {
          throw insertError;
        }
      }
    }

    res.status(httpStatus.CREATED).json({
      message: "Reporte de mantenimiento guardado exitosamente",
      data: report
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
}

async function getMaintenanceReport(req, res) {
  try {
    const { id } = req.params;
    const report = await MaintenanceReport.findByPk(id, {
      include: [
        { model: MaintenanceAnswer, as: "answers" },
        {
          model: Proyect,
          as: "projectData",
          include: [
            {
              model: require("../models/clients"),
              as: "customerData",
              include: [
                { model: require("../models/contactClient"), as: "contactos" }
              ]
            },
            { model: require("../models/elevatorType"), as: "elevatorTypeData" },
            { model: require("../models/typeDriveSystem"), as: "driveSystemData" }
          ]
        },
        { model: User, as: "technicianData" }
      ]
    });
    
    if (!report) return res.status(httpStatus.NOT_FOUND).json({ message: "Reporte no encontrado" });
    
    res.status(httpStatus.OK).json({ data: report });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
}

async function getAllMaintenanceReports(req, res) {
  try {
    const { company } = req.params;
    const reports = await MaintenanceReport.findAll({
      include: [
        { 
          model: Proyect, 
          as: "projectData", 
          where: { company },
          include: [
            {
              model: require("../models/clients"),
              as: "customerData",
              include: [
                { model: require("../models/contactClient"), as: "contactos" }
              ]
            },
            { model: require("../models/elevatorType"), as: "elevatorTypeData" },
            { model: require("../models/typeDriveSystem"), as: "driveSystemData" }
          ]
        },
        { model: User, as: "technicianData" }
      ],
      order: [["date", "DESC"]]
    });
    
    res.status(httpStatus.OK).json({ data: reports });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
}

module.exports = {
  saveMaintenanceReport,
  getMaintenanceReport,
  getAllMaintenanceReports
};
