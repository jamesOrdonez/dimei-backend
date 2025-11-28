const httpStatus = require("http-status");
const conection = require("../db/conection");
const Module = "equipmenttype";

async function saveEqType(req, res) {
    try {
        const { equipmentType, company } = req.body;

        const save = conection.execute(`INSERT INTO ${Module} (equipmentType, company) VALUES (?, ?)`, [equipmentType, company]);
        if (save) {
            res.status(httpStatus.OK).json({
                message: "Registro creado",
                module: Module
            })
        }

    } catch (error) {
        console.log(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module
        })
    }
};

async function getEqType(req, res) {
    try {
        const id = req.params.id;
        const data = conection.execute(`SELECT * FROM ${Module} WHERE company = ?`,[id]);

        if(data){
            res.status(httpStatus.OK).json({
                data: data[0],
                module: Module
            })
        }
    } catch (error) {
        console.log(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module
        })
    }
}

async function updateEqType(req, res) {
    try {
        const { equipmentType } = req.body;
        const id = req.params.id;

        const update = await conection.execute(`UPDATE ${Module} SET equipmentType = ? WHERE id = ?`,[equipmentType, id]);

        if (update) {
            res.status(httpStatus.OK).json({
                message: "Registro actualizado.",
                module: Module
            })
        }
    } catch (error) {
        console.log(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module
        })
    }
}

async function deleteEqType(req, res) {
    try {
        const id = req.params.id;

        const deleteEqType = await conection.execute(`DELETE FROM ${Module} WHERE id = ?`,[id]);

        if (deleteEqType) {
            res.status(httpStatus.OK).json({
                message: "Registro eliminado.",
                module: Module
            })
        }
    } catch (error) {
        console.log(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error}`,
            module: Module
        })
    }
}

module.exports = {
    saveEqType,
    getEqType,
    updateEqType,
    deleteEqType
}