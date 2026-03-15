const httpStatus = require("http-status");
const model = require("../models/item_proyect");
const Module = "item_proyect";

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

async function getItemProyect(req, res) {
  try {
    const id = req.params.id;

    const find = await model.findAll({
      where: {
        proyect: id,
      },
    });

    if (find) {
      res.status(httpStatus.OK).json({
        data: data,
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

async function updateItemProyect(req, res) {
  try {
    const id = req.params.id;
    const data = req.body;

    const updated = await model.update(data, {
      where: {
        company: id,
      },
    });

    if (updated) {
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

async function deleted(req, res) {
  try {
    const id = req.params.id;

    const deleteRegister = await model.destroy({
      where: {
        id: id,
      },
    });

    if (deleteRegister) {
      res.status(httpStatus.OK).json({
        message: "Registro eliminado",
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
  updateItemProyect,
  getItemProyect,
  deleted,
};
