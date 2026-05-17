const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const Permission = require("../models/permission");
const Rol = require("../models/rol");

const claveSecreta = "super_secret";

/**
 * Middleware que solo verifica validez del token JWT.
 * El control de permisos granular se realiza en el frontend
 * mediante los permisos literales retornados por /getMyPermissions.
 */
const verifyToken = async (req, res, next) => {
    let token = req.header("Authorization") || req.query.token;
    if (token && token.startsWith("Bearer ")) {
        token = token.replace("Bearer ", "");
    }
    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({
            status: httpStatus.UNAUTHORIZED,
            message: "Debes proporcionar un token.",
        });
    }

    try {
        const tokenData = jwt.verify(token, claveSecreta);
        req.tokenData = tokenData; // { userId, user, rolId, company }
        next();
    } catch (error) {
        return res.status(httpStatus.UNAUTHORIZED).json({
            status: httpStatus.UNAUTHORIZED,
            message: "Token inválido o expirado. Acceso no autorizado.",
        });
    }
};

/**
 * Retorna los permisos literales del usuario autenticado.
 * Se llama desde el frontend al iniciar sesión para cargar el contexto de permisos.
 */
const getMyPermissions = async (req, res) => {
    try {
        const { rolId, company } = req.tokenData;

        const permissions = await Permission.findAll({
            where: { rol: rolId, company },
            attributes: ["permiss"],
        });

        const permissList = permissions.map(p => p.permiss);

        // Obtener el nombre del rol para determinar si es admin
        const rol = await Rol.findOne({ where: { id: rolId } });

        return res.status(httpStatus.OK).json({
            permissions: permissList,
            rolName: rol ? rol.name : null,
            isAdmin: rol ? rol.name === "Administrador" : false,
        });
    } catch (error) {
        console.error("Error en getMyPermissions:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Error obteniendo permisos.",
        });
    }
};

/**
 * Mantiene compatibilidad con rutas que todavía usen protectedRoute(options).
 * En la nueva arquitectura solo verifica el token.
 */
const protectedRoute = (options) => verifyToken;

module.exports = protectedRoute;
module.exports.verifyToken = verifyToken;
module.exports.getMyPermissions = getMyPermissions;