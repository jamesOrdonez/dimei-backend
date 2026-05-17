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
      answers 
    } = req.body;

    // 1. Create Report
    const report = await MaintenanceReport.create({
      project_id,
      technician_id,
      customer_signature: base64ToFile(customer_signature, 'signatures'),
      technician_signature: base64ToFile(technician_signature, 'signatures'),
      customer_name: customer_name || null,
      date: new Date()
    });

    // 2. Create Answers
    if (answers && typeof answers === 'object') {
      const answerRecords = Object.entries(answers).map(([key, data]) => {
        return {
          maintenance_report_id: report.id,
          question_id: data.question_id || key,
          answer_text: data.text || null,
          selected_options: data.optionIds || [],
          // Convert all photos from base64 (if they are) to files
          photos: data.photos?.map(p => base64ToFile(p.preview, 'maintenance')) || [] 
        };
      });
      await MaintenanceAnswer.bulkCreate(answerRecords);
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
        { model: MaintenanceAnswer, as: "answers" }
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
            { model: require("../models/clients"), as: "customerData" },
            { model: require("../models/elevatorType"), as: "elevatorTypeData" }
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
