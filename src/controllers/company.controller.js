const httpStatus = require("http-status");
const conection = require("../db/conection");
const Module = "company";

async function saveCompany(req, res) {
  try {
    const { name } = req.body;

    const save = await conection.execute(
      `INSERT INTO company (name) VALUE (?)`,
      [name]
    );
    if (save) {
      res.status(httpStatus.OK).json({
        message: "Registro creado.",
        module: Module,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
}

async function getCompany(req, res) {
  try {
    const company = await conection.execute(
      `SELECT * FROM company ORDER BY 1 DESC`
    );
    if (company) {
      res.status(httpStatus.OK).json({
        data: company[0],
        module: Module,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
}

async function updateCompany(req, res) {
  try {
    const id = req.params.id;
    const { name } = req.body;
    const update = await conection.execute(
      `UPDATE company SET name = ? WHERE id = ?`,
      [name, id]
    );
    if (update) {
      res.status(httpStatus.OK)({
        message: "Registro actualizado.",
        module: Module,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
}

async function deleteCompany(req, res) {
  try {
    const id = req.params.id;
    const deleteCompany = await conection.execute(
      `DELETE FROM company WHERE id = ?`,
      [id]
    );

    if (deleteCompany) {
      res.status(httpStatus.OK).json({
        message: "Registro eliminado",
        module: Module,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
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
