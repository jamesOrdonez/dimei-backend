const httpStatus = require("http-status");
const Rol = require("../models/rol");
const Permission = require("../models/permission");
const { Op } = require("sequelize");

const ModuleName = "rol";

// Roles base que no se pueden eliminar
const BASE_ROLES = ["Almacenista", "Diseñador", "Administrador"];

async function getRoles(req, res) {
    try {
        const { company } = req.params;
        const roles = await Rol.findAll({
            where: { company, state: true },
            order: [["id", "ASC"]],
        });
        res.status(httpStatus.OK).json({ data: roles, module: ModuleName });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: ModuleName });
    }
}

async function saveRol(req, res) {
    try {
        const { name, company } = req.body;
        if (!name || !company) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Nombre y empresa son requeridos", module: ModuleName });
        }

        // Verificar duplicado
        const exists = await Rol.findOne({ where: { name, company } });
        if (exists) {
            return res.status(httpStatus.CONFLICT).json({ message: "Ya existe un rol con ese nombre", module: ModuleName });
        }

        const rol = await Rol.create({ name, company, state: true });
        res.status(httpStatus.CREATED).json({ message: "Rol creado", data: rol, module: ModuleName });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: ModuleName });
    }
}

async function updateRol(req, res) {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const rol = await Rol.findByPk(id);
        if (!rol) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Rol no encontrado", module: ModuleName });
        }

        // Roles base no pueden cambiar de nombre
        if (BASE_ROLES.includes(rol.name) && name && name !== rol.name) {
            return res.status(httpStatus.FORBIDDEN).json({ message: "No se puede renombrar un rol base", module: ModuleName });
        }

        await rol.update({ name: name || rol.name });
        res.status(httpStatus.OK).json({ message: "Rol actualizado", data: rol, module: ModuleName });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: ModuleName });
    }
}

async function deleteRol(req, res) {
    try {
        const { id } = req.params;
        const rol = await Rol.findByPk(id);

        if (!rol) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Rol no encontrado", module: ModuleName });
        }

        if (BASE_ROLES.includes(rol.name)) {
            return res.status(httpStatus.FORBIDDEN).json({ message: "No se pueden eliminar los roles base del sistema", module: ModuleName });
        }

        await Permission.destroy({ where: { rol: id } });
        await Rol.destroy({ where: { id } });
        res.status(httpStatus.OK).json({ message: "Rol eliminado", module: ModuleName });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: ModuleName });
    }
}

module.exports = { getRoles, saveRol, updateRol, deleteRol };
