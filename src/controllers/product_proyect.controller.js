const httpStatus = require("http-status");
const model = require("../models/product_proyect");
const Module = "product_proyect";

async function save(req, res) {
  try {
    const { projectId, item, quantity } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({
        message: "No hay productos para guardar",
      });
    }

    const dataToInsert = products.map((p) => ({
      proyect: projectId,
      item: p.id,
      quantity
    }));

    const saved = await model.bulkCreate(dataToInsert);

    res.status(200).json({
      message: "Registros creados",
      data: saved,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: `Error interno en el servidor: ${error}`,
    });
  }
}

async function getProductProyect(req, res) {
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

async function updateProductProyect(req, res) {
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
  getProductProyect,
  updateProductProyect,
  deleted,
};
