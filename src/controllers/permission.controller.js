const httpStatus = require("http-status");
const Permission = require("../models/permission");
const ModuleName = "permission";
const Module = require("../models/modules");
const rol = require("../models/rol");
const User = require("../models/user");
async function getPermissRol(req, res) {
    try {
        const companyId = req.params.id;

        const permissions = await Permission.findAll({
            where: { company: companyId },
            order: [["id", "DESC"]],
            include: [
                { model: User, attributes: ["name"], as: "userData" },
                { model: Rol, attributes: ["name"], as: "rolData" },
                { model: Module, attributes: ["module"], as: "moduleData" },
            ],
        });

        res.status(httpStatus.OK).json({
            data: permissions,
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

async function savePermission(req, res) {
    try {
        const { permiss, module, rol, company } = req.body;

        const newPermiss = await Permission.create({ permiss, module, rol, company });

        res.status(httpStatus.CREATED).json({
            message: "Registro creado",
            module: ModuleName,
            data: newPermiss,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: ModuleName,
        });
    }
}

async function updatePermission(req, res) {
    try {
        const id = req.params.id;
        const { permiss, module, rol } = req.body;

        const [updated] = await Permission.update({ permiss, module, rol }, { where: { id } });

        if (!updated) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "Registro no encontrado",
                module: ModuleName,
            });
        }

        const updatedPermiss = await Permission.findByPk(id);

        res.status(httpStatus.OK).json({
            message: "Registro actualizado",
            module: ModuleName,
            data: updatedPermiss,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error interno en el servidor: ${error.message}`,
            module: ModuleName,
        });
    }
}

async function deletePermission(req, res) {
    try {
        const id = req.params.id;

        const deleted = await Permission.destroy({ where: { id } });

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
    getPermissRol,
    savePermission,
    updatePermission,
    deletePermission,
};