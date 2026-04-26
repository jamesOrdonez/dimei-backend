const httpStatus = require("http-status");
const ToolGroup = require("../models/ToolGroup");
const Module = "tool_group";

async function saveToolGroup(req, res) {
  try {
    const { name, state, company } = req.body;
    const record = await ToolGroup.create({ name, state, company });

    res.status(httpStatus.CREATED).json({
      message: "Registro guardado",
      module: Module,
      data: record,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function getToolGroups(req, res) {
  try {
    const companyId = req.params.id;
    const records = await ToolGroup.findAll({
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

async function getOneToolGroup(req, res) {
  try {
    const id = req.params.id;
    const record = await ToolGroup.findByPk(id);

    if (!record) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Grupo no encontrado", module: Module });
    }

    res.status(httpStatus.OK).json({ data: record, module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function updateToolGroup(req, res) {
  try {
    const { name, state } = req.body;
    const id = req.params.id;

    const [updated] = await ToolGroup.update({ name, state }, { where: { id } });

    if (!updated) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Grupo no encontrado", module: Module });
    }

    const updatedRecord = await ToolGroup.findByPk(id);
    res.status(httpStatus.OK).json({ message: "Registro actualizado", module: Module, data: updatedRecord });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function deleteToolGroup(req, res) {
  try {
    const id = req.params.id;
    const deleted = await ToolGroup.destroy({ where: { id } });

    if (!deleted) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Grupo no encontrado", module: Module });
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
  saveToolGroup,
  getToolGroups,
  getOneToolGroup,
  updateToolGroup,
  deleteToolGroup,
};
