const httpStatus = require("http-status");
const ModuleModel = require("../models/modules");
const ModuleName = 'module';

async function getModule(req, res) {
    try {
        const modules = await ModuleModel.findAll({
            order: [["id", "DESC"]],
        });

        res.status(httpStatus.OK).json({
            data: modules,
            module: ModuleName,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: ModuleName,
        });
    }
}

async function saveModule(req, res) {
    try {
        const { module } = req.body;

        const newModule = await ModuleModel.create({ module });

        res.status(httpStatus.CREATED).json({
            message: "Registro guardado",
            module: ModuleName,
            data: newModule,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: ModuleName,
        });
    }
}

async function updateModule(req, res) {
    try {
        const id = req.params.id;
        const { module } = req.body;

        const [updated] = await ModuleModel.update({ module }, { where: { id } });

        if (!updated) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "Registro no encontrado",
                module: ModuleName,
            });
        }

        const updatedModule = await ModuleModel.findByPk(id);

        res.status(httpStatus.OK).json({
            message: "Registro actualizado",
            module: ModuleName,
            data: updatedModule,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: ModuleName,
        });
    }
}

async function deleteModule(req, res) {
    try {
        const id = req.params.id;

        const deleted = await ModuleModel.destroy({ where: { id } });

        if (!deleted) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "Registro no encontrado",
                module: ModuleName,
            });
        }

        res.status(httpStatus.OK).json({
            message: "Registro eliminado",
            module: ModuleName,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: ModuleName,
        });
    }
}

module.exports = {
    getModule,
    saveModule,
    updateModule,
    deleteModule,
};