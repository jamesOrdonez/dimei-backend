const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const conection = require("../db/conection");
const claveSecreta = "super_secret";

const protectedRoute = (options) => {
  return async (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log("🚀 ~ return ~ token:", token);

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: httpStatus.UNAUTHORIZED,
        message: "Debes proporcionar un token.",
      });
    }

    try {
      //? Extraer los datos del token
      const tokenData = jwt.verify(token, claveSecreta);
      const rolId = tokenData.rolId;

      const method = req.method.toUpperCase();
      const module = options.Module;

      //? Permisos del rol
      const permiss = await conection.execute(
        `SELECT u.name, p.permiss, p.id, m.module 
         FROM user u 
         JOIN rol r ON r.id = u.rol 
         JOIN permission p ON p.rol = r.id 
         JOIN module m ON m.id = p.module 
         WHERE r.id = ?`, 
        [rolId]
      );

      console.log("🚀 ~ permiss:", permiss);

      if (!permiss || permiss.length === 0) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          status: httpStatus.UNAUTHORIZED,
          message: "No tienes permisos para acceder a esta ruta.",
        });
      }

      //? Asignar los resultados de las consultas en arrays
      const permissGranted = permiss[0];
      const modulesWithpermiss = {};

      //? Organiza los módulos con sus respectivos permisos
      permissGranted.forEach(item => {
        if (modulesWithpermiss[item.module]) {
          modulesWithpermiss[item.module].permiss.push(item.permiss);
        } else {
          modulesWithpermiss[item.module] = {
            id: item.id,
            module: item.module,
            permiss: [item.permiss],
          };
        }
      });
      
      console.log("🚀 ~ modulesWithpermiss:", modulesWithpermiss);

      //? Eliminar duplicados de los arrays de permisos
      const mergedDataWithUniquepermiss = {};
      for (const key in modulesWithpermiss) {
        const modules = modulesWithpermiss[key];
        const uniquepermiss = [...new Set(modules.permiss)];
        mergedDataWithUniquepermiss[key] = {
          id: modules.id,
          module: modules.module,
          permiss: uniquepermiss,
        };
      }

      console.log("🚀 ~ mergedDataWithUniquepermiss:", mergedDataWithUniquepermiss);

      const result = Object.values(mergedDataWithUniquepermiss);
      console.log("🚀 ~ result:", result);

      //? Compara si el método de la petición realizada al módulo se encuentra en el array de permiss
      const hasPermission = result.some((item) => {
        return item.module === module && item.permiss.includes(method);
      });

      console.log("🚀 ~ hasPermission:", hasPermission);

      if (!hasPermission) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          status: httpStatus.UNAUTHORIZED,
          message: "No tienes permisos para realizar esta acción.",
        });
      }

      next();
    } catch (error) {
      console.log("🚀 ~ error:", error);
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: httpStatus.UNAUTHORIZED,
        message: "Token inválido o expirado. Acceso no autorizado.",
      });
    }
  };
};

module.exports = protectedRoute;
