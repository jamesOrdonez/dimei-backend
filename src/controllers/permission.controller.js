const httpStatus = require("http-status");
const Permission = require("../models/permission");
const PermissionCatalog = require("../models/permissionCatalog");
const Rol = require("../models/rol");

const ModuleName = "permission";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

/** Devuelve el catálogo completo como un mapa: nombre → id */
async function getCatalogMap() {
    const catalog = await PermissionCatalog.findAll({ attributes: ["id", "name"] });
    const nameToId = {};
    const idToName = {};
    catalog.forEach(c => {
        nameToId[c.name] = c.id;
        idToName[c.id]   = c.name;
    });
    return { nameToId, idToName, catalog };
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /getPermissions/:id
 * Devuelve los permisos asignados a un rol, con el listado completo del catálogo.
 * Respuesta: { data: [{ id, permiss }], allPermissions: [...] }
 * — el frontend sigue leyendo data[].permiss como antes.
 */
async function getPermissRol(req, res) {
    try {
        const rolId = req.params.id;

        const { idToName, catalog } = await getCatalogMap();

        const privileges = await Permission.findAll({
            where: { rol: rolId },
            attributes: ["id", "id_permiso"],
        });

        // Transformar a formato que el frontend ya conoce: { id, permiss }
        const data = privileges.map(p => ({
            id: p.id,
            permiss: idToName[p.id_permiso] || null,
        }));

        const allPermissions = catalog.map(c => c.name);

        res.status(httpStatus.OK).json({
            data,
            allPermissions,
            module: ModuleName,
        });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, module: ModuleName });
    }
}

/**
 * POST /syncPermissions
 * Reemplaza todos los permisos de un rol.
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

        // Verificar que el rol existe
        const rol = await Rol.findByPk(rolId);
        if (!rol) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Rol no encontrado", module: ModuleName });
        }

        const { nameToId } = await getCatalogMap();

        // Filtrar solo nombres que existan en el catálogo
        const validPermissions = permissions.filter(p => nameToId[p]);

        // Reemplazar todos los privilegios del rol
        await Permission.destroy({ where: { rol: rolId, company } });

        if (validPermissions.length > 0) {
            const records = validPermissions.map(p => ({
                rol: rolId,
                company,
                id_permiso: nameToId[p],
            }));
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
 * GET /getMyPermissions
 * Retorna todos los permisos del usuario autenticado (según su rol).
 * Respuesta: { permissions: ["Crear ítems", ...], rolName, isAdmin, allPermissions }
 */
async function getMyPermissions(req, res) {
    try {
        const { rolId, company } = req.tokenData;

        const { idToName, catalog } = await getCatalogMap();

        const privileges = await Permission.findAll({
            where: { rol: rolId, company },
            attributes: ["id_permiso"],
        });

        const permissList = privileges.map(p => idToName[p.id_permiso]).filter(Boolean);
        const rol = await Rol.findOne({ where: { id: rolId } });

        return res.status(httpStatus.OK).json({
            permissions: permissList,
            rolName: rol ? rol.name : null,
            isAdmin: rol ? rol.name === "Administrador" : false,
            allPermissions: catalog.map(c => c.name),
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
};