const httpStatus = require("http-status");
const Permission = require("../models/permission");
const Rol = require("../models/rol");

const ModuleName = "permission";

// Los 8 permisos literales configurables del sistema
const ALLOWED_PERMISSIONS = [
    "Acceso a ingresar material",
    "Hacer remisiones de proyectos",
    "Crear ítems",
    "Crear productos",
    "Crear proyectos",
    "Consultar listas de compras",
    "Anexar actas de entrega",
    "Pedir material adicional",
];

/**
 * Obtener permisos de un rol específico
 */
async function getPermissRol(req, res) {
    try {
        const rolId = req.params.id;
        const permissions = await Permission.findAll({
            where: { rol: rolId },
            attributes: ["id", "permiss"],
        });
        res.status(httpStatus.OK).json({
            data: permissions,
            allPermissions: ALLOWED_PERMISSIONS,
            module: ModuleName,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: ModuleName });
    }
}

/**
 * Sincroniza (reemplaza) todos los permisos de un rol.
 * Body: { rolId, company, permissions: ["Crear ítems", "Crear productos", ...] }
 */
async function syncPermissions(req, res) {
    try {
        const { rolId, company, permissions } = req.body;

        if (!rolId || !company || !Array.isArray(permissions)) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "rolId, company y permissions[] son requeridos",
                module: ModuleName,
            });
        }

        // Validar que solo vengan permisos permitidos
        const validPermissions = permissions.filter(p => ALLOWED_PERMISSIONS.includes(p));

        // Verificar que el rol existe
        const rol = await Rol.findByPk(rolId);
        if (!rol) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Rol no encontrado", module: ModuleName });
        }

        // Reemplazar todos los permisos del rol
        await Permission.destroy({ where: { rol: rolId, company } });

        if (validPermissions.length > 0) {
            const records = validPermissions.map(p => ({ rol: rolId, company, permiss: p }));
            await Permission.bulkCreate(records);
        }

        res.status(httpStatus.OK).json({
            message: "Permisos actualizados correctamente",
            permissions: validPermissions,
            module: ModuleName,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: ModuleName });
    }
}

/**
 * Retorna todos los permisos del usuario autenticado (según su rol).
 * Usado por el frontend al cargar el contexto de permisos.
 */
async function getMyPermissions(req, res) {
    try {
        const { rolId, company } = req.tokenData;

        const permissions = await Permission.findAll({
            where: { rol: rolId, company },
            attributes: ["permiss"],
        });

        const permissList = permissions.map(p => p.permiss);
        const rol = await Rol.findOne({ where: { id: rolId } });

        return res.status(httpStatus.OK).json({
            permissions: permissList,
            rolName: rol ? rol.name : null,
            isAdmin: rol ? rol.name === "Administrador" : false,
            allPermissions: ALLOWED_PERMISSIONS,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: ModuleName });
    }
}

module.exports = {
    getPermissRol,
    syncPermissions,
    getMyPermissions,
    ALLOWED_PERMISSIONS,
};