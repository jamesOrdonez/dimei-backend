const httpStatus = require("http-status");
const model = require('../models/group_product');
const Module = "group_product";

async function saveGroupProduct(req, res) {
    try {
        const groupProduct = await model.create(req.body);
        res.status(httpStatus.CREATED).json({
            message: "Registro creado",
            module: Module,
            data: groupProduct,
        });
    } catch (error) {
        console.error("❌ ERROR AL INSERTAR GRUPO DE PRODUCTOS:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno en el servidor",
            error: error.message,
            module: Module,
        });
    }
};

async function getGroupProducts(req, res) {
    try {
        const companyId = req.params.id;
        const groupProducts = await model.findAll({
            order: [["id", "DESC"]],
        });
        res.status(httpStatus.OK).json({ data: groupProducts, module: Module });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error interno en el servidor",
            error: error.message,
            module: Module,
        });
    }
};

async function update(req, res) {
    try {
        const id = req.params.id;
        const data = req.data;

        const update = await model.update(data, {
            where: { id: id }
        });

        if (update) {
            res.status(httpStatus.OK).json({
                message: 'Registro actualizado',
                Module: Module,
            })
        }
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el server: ${error}`,
            Module: Module,
        })
    }
}

async function deleted(req, res) {
    try {
        const id = req.params.id;

        const deleted = await model.destroy({
            where: { id: id }
        });

        if (deleted) {
            res.status(httpStatus.OK).json({
                message: "Registro eliminado",
                Module: Module
            })
        }

    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el server: ${error}`,
            Module: Module,
        })
    }
};

module.exports = {
    saveGroupProduct,
    getGroupProducts,
    update,
    deleted
}
