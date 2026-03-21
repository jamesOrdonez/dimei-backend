const httpStatus = require("http-status");
const model = require("../models/item_proyect");
const Module = "item_proyect";

async function save(req, res) {
  try {
    const { projectId } = req.body;

    const products = parseProducts(req.body);

    const saved = await model.create({
      projectId
    });

    if (products.length > 0) {
      const dataToInsert = products.map((p) => ({
        productId: p.id,
        projectId: saved.id,
      }));

      await ProductModel.bulkCreate(dataToInsert);
    }

    res.status(200).json({
      message: "Registro creado",
      data: saved,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: `Error interno en el servidor: ${error}`,
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
