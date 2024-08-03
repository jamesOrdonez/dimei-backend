const httpStatus = require("http-status");
const conection = require("../db/conection");
const Module = "equipmenttype";

async function saveEqType(req, res) {
    try {
        const { equipmentType } = req.body;
        
    } catch (error) {
        console.log(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module
        })
    }
}