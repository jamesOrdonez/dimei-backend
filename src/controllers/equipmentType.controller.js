const httpStatus = require("http-status");
const EquipmentType = require("../models/equipmenttype");
const Module = "equipmenttype";

async function saveEqType(req, res) {
    try {
        const { equipmentType, company } = req.body;
        const eqType = await EquipmentType.create({ equipmentType, company });

        res.status(httpStatus.OK).json({
            message: "Registro creado",
            module: Module,
            data: eqType,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: Module,
        });
    }
}

async function getEqType(req, res) {
    try {
        const id = req.params.id;
        const data = await EquipmentType.findAll({
            where: { company: id },
            order: [["id", "DESC"]],
        });

        res.status(httpStatus.OK).json({
            data,
            module: Module,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: Module,
        });
    }
}

async function updateEqType(req, res) {
    try {
        const { equipmentType } = req.body;
        const id = req.params.id;

        const [updated] = await EquipmentType.update(
            { equipmentType },
            { where: { id } }
        );

        if (updated) {
            const updatedEqType = await EquipmentType.findByPk(id);
            res.status(httpStatus.OK).json({
                message: "Registro actualizado.",
                module: Module
            });
        } else {
            res.status(httpStatus.NOT_FOUND).json({
                message: "Registro no encontrado.",
                module: Module,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: Module,
        });
    }
}

async function deleteEqType(req, res) {
    try {
        const id = req.params.id;
        const deleted = await EquipmentType.destroy({ where: { id } });

        if (deleted) {
            res.status(httpStatus.OK).json({
                message: "Registro eliminado.",
                module: Module,
            });
        } else {
            res.status(httpStatus.NOT_FOUND).json({
                message: "Registro no encontrado.",
                module: Module,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: Module,
        });
    }
}

module.exports = {
    saveEqType,
    getEqType,
    updateEqType,
    deleteEqType,
};