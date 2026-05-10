const httpStatus = require("http-status");
const TechnicianSignature = require("../models/technicianSignature");

const { base64ToFile } = require("../utils/fileUpload");

async function getMySignatures(req, res) {
  try {
    const { userId } = req.params; // Or get from token
    const records = await TechnicianSignature.findAll({
      where: { user_id: userId },
      order: [["id", "DESC"]],
    });
    res.status(httpStatus.OK).json({ data: records });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
}

async function saveSignature(req, res) {
  try {
    const { user_id, signature, name } = req.body;
    const signaturePath = base64ToFile(signature, 'signatures');
    const record = await TechnicianSignature.create({ user_id, signature: signaturePath, name });
    res.status(httpStatus.CREATED).json({ data: record, message: "Firma guardada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
}

async function deleteSignature(req, res) {
  try {
    const { id } = req.params;
    await TechnicianSignature.destroy({ where: { id } });
    res.status(httpStatus.OK).json({ message: "Firma eliminada" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
}

module.exports = {
  getMySignatures,
  saveSignature,
  deleteSignature,
};
