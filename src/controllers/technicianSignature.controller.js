const httpStatus = require("http-status");
const TechnicianSignature = require("../models/technicianSignature");

const { base64ToFile, deleteFile } = require("../utils/fileUpload");

async function getMySignatures(req, res) {
  try {
    const userId = req.tokenData.userId; // Always use the authenticated user's ID
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
    const userId = req.tokenData.userId; // Always use the authenticated user's ID
    const { signature, name } = req.body;
    const signaturePath = base64ToFile(signature, 'signatures');
    const record = await TechnicianSignature.create({ user_id: userId, signature: signaturePath, name });
    res.status(httpStatus.CREATED).json({ data: record, message: "Firma guardada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
}

async function deleteSignature(req, res) {
  try {
    const { id } = req.params;
    const userId = req.tokenData.userId;

    const record = await TechnicianSignature.findByPk(id);
    if (!record) return res.status(httpStatus.NOT_FOUND).json({ message: "Firma no encontrada" });

    // Ownership check — users can only delete their own signatures
    if (record.user_id !== userId) {
      return res.status(httpStatus.FORBIDDEN).json({ message: "No tienes permiso para eliminar esta firma" });
    }

    // Delete file from disk before removing the DB record
    deleteFile(record.signature);

    await record.destroy();
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
