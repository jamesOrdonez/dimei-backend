const httpStatus = require("http-status");
const model = require("../models/proyect");
const Module = "proyect";

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

module.exports = {
  save,
};
