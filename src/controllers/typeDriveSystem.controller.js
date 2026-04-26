const httpStatus = require("http-status");
const model = require("../models/typeDriveSystem");
const Module = "typeDriveSystem";

async function save(req, res) {
  try {
    const data = req.body;

    const saved = await model.create(data);

    if (saved) {
      res.status(httpStatus.OK).json({
        message: "Registro creado",
        Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      Module,
    });
  }
}

async function getDriveSystem(req, res) {
  try {
    const id = req.params.id;

    const data = await model.findAll({
      where: {
        company: id,
      },
    });

    if (data) {
      res.status(httpStatus.OK).json({
        data: data,
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      Module,
    });
  }
}

async function updateDriveSystem(req, res) {
  try {
    const id = req.params.id;
    const data = req.body;

    const update = await model.update(data, {
      where: {
        id: id,
      },
    });

    if (update) {
      res.status(httpStatus.OK).json({
        message: "Registro actualizado",
        Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      Module,
    });
  }
}

async function deleteDriveSystem(req, res) {
  try {
    const id = req.params.id;

    const data = await model.destroy({
      where: {
        id: id,
      },
    });

    if (data) {
      res.status(httpStatus.OK).json({
        message: "registro eliminado",
        Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      Module,
    });
  }
}

module.exports = {
  save,
  getDriveSystem,
  updateDriveSystem,
  deleteDriveSystem,
};
