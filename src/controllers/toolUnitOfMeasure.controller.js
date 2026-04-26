const httpStatus = require("http-status");
const ToolUnitOfMeasure = require("../models/ToolUnitOfMeasure");
const Module = "tool_unit_of_measure";

async function getToolUnitOfMeasures(req, res) {
  try {
    const companyId = req.params.id;
    const records = await ToolUnitOfMeasure.findAll({
      where: { company: companyId },
      order: [["id", "DESC"]],
    });

    res.status(httpStatus.OK).json({ data: records, module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function saveToolUnitOfMeasure(req, res) {
  try {
    const { unitOfMeasure, company } = req.body;
    await ToolUnitOfMeasure.create({ unitOfMeasure, company });

    res.status(httpStatus.CREATED).json({ message: "Registro creado", module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function updateToolUnitOfMeasure(req, res) {
  try {
    const { unitOfMeasure } = req.body;
    const id = req.params.id;

    const [updated] = await ToolUnitOfMeasure.update({ unitOfMeasure }, { where: { id } });

    if (!updated) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Registro no encontrado", module: Module });
    }

    res.status(httpStatus.OK).json({ message: "Registro actualizado", module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function deleteToolUnitOfMeasure(req, res) {
  try {
    const id = req.params.id;
    const deleted = await ToolUnitOfMeasure.destroy({ where: { id } });

    if (!deleted) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Registro no encontrado", module: Module });
    }

    res.status(httpStatus.OK).json({ message: "Registro eliminado", module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

module.exports = {
  getToolUnitOfMeasures,
  saveToolUnitOfMeasure,
  updateToolUnitOfMeasure,
  deleteToolUnitOfMeasure,
};
