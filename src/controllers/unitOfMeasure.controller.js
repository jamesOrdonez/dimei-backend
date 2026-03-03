const httpStatus = require("http-status");
const UnitOfMeasure = require("../models/unitOfMeasure");

const Module = "unitofmeasure";

async function get(req, res) {
  try {

    const data = await UnitOfMeasure.findAll({
      order: [["id", "DESC"]],
    });

    return res.status(httpStatus.OK).json({
      data,
      module: Module,
    });

  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error.message,
      module: Module,
    });
  }
}

async function post(req, res) {
  try {

    const { unitOfMeasure, company } = req.body;

    await UnitOfMeasure.create({
      unitOfMeasure,
      company,
    });

    return res.status(httpStatus.CREATED).json({
      message: "Registro creado",
      module: Module,
    });

  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error.message,
      module: Module,
    });
  }
}

async function update(req, res) {
  try {

    const { unitOfMeasure } = req.body;
    const id = req.params.id;

    const [updated] = await UnitOfMeasure.update(
      { unitOfMeasure },
      { where: { id } }
    );

    if (!updated) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Registro no encontrado",
        module: Module,
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Registro actualizado",
      module: Module,
    });

  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error.message,
      module: Module,
    });
  }
}

async function Delete(req, res) {
  try {

    const id = req.params.id;

    const deleted = await UnitOfMeasure.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Registro no encontrado",
        module: Module,
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Registro eliminado",
      module: Module,
    });

  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error.message,
      module: Module,
    });
  }
}

module.exports = {
  get,
  post,
  update,
  Delete,
};