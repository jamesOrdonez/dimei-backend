const httpStatus = require("http-status");
const Company = require("../models/company");
const Module = "company";

async function saveCompany(req, res) {
  try {
    const { name } = req.body;
    const company = await Company.create({ name });

    res.status(httpStatus.OK).json({
      message: "Registro creado.",
      module: Module,
      data: company,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function getCompany(req, res) {
  try {
    const companies = await Company.findAll({
      order: [["id", "DESC"]],
    });

    res.status(httpStatus.OK).json({
      data: companies,
      module: Module,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function updateCompany(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const [updated] = await Company.update({ name }, { where: { id } });

    if (updated) {
      const updatedCompany = await Company.findByPk(id);
      res.status(httpStatus.OK).json({
        message: "Registro actualizado.",
        module: Module,
        data: updatedCompany,
      });
    } else {
      res.status(httpStatus.NOT_FOUND).json({
        message: "Registro no encontrado.",
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function deleteCompany(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Company.destroy({ where: { id } });

    if (deleted) {
      res.status(httpStatus.OK).json({
        message: "Registro eliminado",
        module: Module,
      });
    } else {
      res.status(httpStatus.NOT_FOUND).json({
        message: "Registro no encontrado",
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

module.exports = {
  saveCompany,
  getCompany,
  updateCompany,
  deleteCompany,
};