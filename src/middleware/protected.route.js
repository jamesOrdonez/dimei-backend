const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");

const Permission = require("../models/permission");
const Rol = require("../models/rol");
const ModuleModel = require("../models/modules");

const claveSecreta = "super_secret";

const protectedRoute = (options) => {
  return async (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: httpStatus.UNAUTHORIZED,
        message: "Debes proporcionar un token.",
      });
    }

    try {
      const tokenData = jwt.verify(token, claveSecreta);
      const rolId = tokenData.rolId;
      const companyId = tokenData.company;
      const method = req.method.toUpperCase();
      const moduleName = options.Module;

      // 🔹 Buscar permisos usando alias
      const permissions = await Permission.findAll({
        include: [
          {
            model: Rol,
            as: "Rol",
            where: { id: rolId, company: companyId },
            attributes: []
          },
          {
            model: ModuleModel,
            as: "Module",
            attributes: ["module"]
          }
        ]
      });

      if (!permissions || permissions.length === 0) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          status: httpStatus.UNAUTHORIZED,
          message: "No tienes permisos para acceder a esta ruta.",
        });
      }

      // 🔹 Mapear permisos por módulo
      const modulesWithPermiss = {};
      permissions.forEach(p => {
        const modName = p.Module.module;
        if (!modulesWithPermiss[modName]) modulesWithPermiss[modName] = new Set();
        modulesWithPermiss[modName].add(p.permiss);
      });

      const hasPermission = modulesWithPermiss[moduleName]?.has(method) || false;

      if (!hasPermission) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          status: httpStatus.UNAUTHORIZED,
          message: "No tienes permisos para realizar esta acción.",
        });
      }

      next();
    } catch (error) {
      console.error("Error en protectedRoute:", error);
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: httpStatus.UNAUTHORIZED,
        message: "Token inválido o expirado. Acceso no autorizado.",
      });
    }
  };
};

module.exports = protectedRoute;