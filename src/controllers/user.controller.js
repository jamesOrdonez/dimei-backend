const bcrypt = require("bcryptjs");
const httpStatus = require("http-status");
const User = require("../models/user");
const Rol = require("../models/rol");

const Module = "user";


async function saveUser(req, res) {
  try {

    const { name, rol, user, password, state, company } = req.body;

    const passEncripted = await bcrypt.hash(password, 14);

    await User.create({
      name,
      rol,
      user,
      password: passEncripted,
      state,
      company,
    });

    return res.status(httpStatus.CREATED).json({
      message: "Usuario creado exitosamente",
      module: Module,
    });

  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error.message,
      module: Module,
    });
  }
}

async function getUser(req, res) {
  try {

    const { id } = req.params;

    const data = await User.findAll({
      where: { company: id },
      include: [{ model: Rol }],
      order: [["id", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    return res.status(httpStatus.OK).json({
      data,
      module: Module,
    });

  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error.message,
      module: Module,
    });
  }
}

async function getOneUser(req, res) {
  try {

    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [{ model: Rol }],
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Usuario no encontrado",
        module: Module,
      });
    }

    return res.status(httpStatus.OK).json({
      data: user,
      module: Module,
    });

  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error.message,
      module: Module,
    });
  }
}

async function updateuser(req, res) {
  try {

    const { name, rol, user, state } = req.body;
    const { id } = req.params;

    const [updated] = await User.update(
      { name, rol, user, state },
      { where: { id } }
    );

    if (!updated) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Usuario no encontrado",
        module: Module,
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Usuario actualizado.",
      module: Module,
    });

  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error.message,
      module: Module,
    });
  }
}

async function deleteUser(req, res) {
  try {

    const { id } = req.params;

    const deleted = await User.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Usuario no encontrado",
        module: Module,
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Usuario eliminado.",
      module: Module,
    });

  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error.message,
      module: Module,
    });
  }
}

async function changePassword(req, res) {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "El id y la contraseña son requeridos",
        module: Module,
      });
    }

    const passEncripted = await bcrypt.hash(password, 14);

    const [updated] = await User.update(
      { password: passEncripted },
      { where: { id } }
    );

    if (!updated) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Usuario no encontrado",
        module: Module,
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Contraseña actualizada exitosamente",
      module: Module,
    });

  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor: " + error.message,
      module: Module,
    });
  }
}

module.exports = {
  saveUser,
  getUser,
  getOneUser,
  updateuser,
  deleteUser,
  changePassword,
};