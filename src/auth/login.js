const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = "login";

async function login(req, res) {
  try {
    const { user, password } = req.body;

    // Validación de campos
    if (!user || !password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Usuario y contraseña obligatorios",
      });
    }

    // Consulta a la BD
    const [query] = await conection.execute(
      `SELECT *,u.id as userId FROM user u 
       JOIN company c ON c.id = u.company 
       WHERE u.state = 1 AND u.user = ?`,
      [user]
    );

    // Validar usuario encontrado
    if (query.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Usuario no encontrado",
      });
    }

    const data = query[0];

    // Validación contraseña
    const isValidPassword = await bcrypt.compare(password, data.password);

    if (!isValidPassword) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Contraseña incorrecta",
      });
    }

    // Crear token
    const token = jwt.sign(
      {
        userId: data.id,
        user: data.user,
        rolId: data.rol,
        company: data.company,
      },
      "super_secret",
      { expiresIn: "8h" }
    );

    return res.status(httpStatus.OK).json({
      token,
      userId: data.id,
      user: data.user,
      userId: data.userId,
      rolId: data.rol,
      company: data.company,
    });
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor`,
      error: error.message,
      module: Module,
    });
  }
}

module.exports = { login };
