const httpStatus = require("http-status");
const conection = require("../db/conection");
const Module = "unitofmeasure";

async function get(req, res) {
  try {
    const data = await conection.execute(
      "SELECT * FROM unitofmeasure ORDER BY 1 DESC"
    );

    if (data) {
      res.status(httpStatus.OK).json({
        data: data[0],
        module: Module,
      });
    }
  } catch (error) {
    console.log(error),
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Error interno en el servidor: " + error,
        module: Module,
      });
  }
}

async function post(req, res) {
  try {
    const { unitOfMeasure, company } = req.body;
    const save = await conection.execute(
      `INSERT INTO unitofmeasure (unitOfMeasure, company) VALUES (?, ?)`,
      [unitOfMeasure, company]
    );
    if (save) {
      res.status(httpStatus.CREATED).json({
        message: "Registro creado",
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
}

async function update(req, res) {
  try {
    const { unitOfMeasure } = req.body;
    const id = req.params.id;

    const updatePermiss = await conection.execute(
      `UPDATE unitofmeasure SET unitOfMeasure=? WHERE id = ?`,
      [unitOfMeasure, id]
    );

    if (updatePermiss) {
      res.status(httpStatus.OK).json({
        message: "Registro actualizado",
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
}

async function Delete(req, res) {
  try {
    const id = req.params.id;

    const deleteProyect = await conection.execute(
      `DELETE FROM ${Module} WHERE id = ?`,
      [id]
    );
    if (deleteProyect) {
      res.status(httpStatus.OK).json({
        message: "Registro eliminado",
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
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
