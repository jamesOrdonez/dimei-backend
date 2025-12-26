const httpStatus = require("http-status");
const conection = require("../db/conection");
const Module = "unitOfMeasuremet";

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

module.exports = {
  get,
};
