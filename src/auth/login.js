const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const httpStatus = require("http-status");

const User = require("../models/user");
const Company = require("../models/company");
const Rol = require("../models/rol");


async function login(req, res) {
  try {
    const { user, password } = req.body;

    if (!user || !password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Usuario y contraseña obligatorios",
      });
    }

    const dbUser = await User.findOne({
      where: { user, state: true },
      include: [
        { model: Company, attributes: ["id", "name"] },
        { model: Rol, attributes: ["id", "name"] }
      ]

    });

    if (!dbUser) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Usuario no encontrado",
      });
    }

    const isValidPassword = await bcrypt.compare(password, dbUser.password);
    if (!isValidPassword) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Contraseña incorrecta",
      });
    }

    const token = jwt.sign({
      userId: dbUser.id,
      user: dbUser.user,
      rolId: dbUser.rol,
      company: dbUser.company,
    }, "super_secret", { expiresIn: "8h" });

    return res.status(httpStatus.OK).json({
      token,
      userId: dbUser.id,
      user: dbUser.user,
      name: dbUser.name,
      rolId: dbUser.rol,
      rolName: dbUser.Rol?.name || null,
      company: dbUser.company,
      companyName: dbUser.Company?.name || null

    });

  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      error: error.message,
      module: "login",
    });
  }
}

module.exports = { login };