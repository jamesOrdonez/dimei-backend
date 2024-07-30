const conection = require("../db/conection");
const bcrypt = require("bcryptjs");
const httpStatus = require("http-status");
const Module = "user";

async function saveUser(req, res) {
  try {
    const { name, rol, user, password, state, company } = req.body;
    const passEncripted = await bcrypt.hash(password, 8);

    const saveUser = await conection.execute(
      `INSERT INTO user (name, rol, user, password, state, company) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, rol, user, passEncripted, state, company]
    );

    if (saveUser) {
      res.status(httpStatus.CREATED).json({
        message: "Usuario creado exitosamente",
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
}

async function getUser(req, res) {
  try {
    const data = await conection.execute(`SELECT * FROM user WHERE company = ? ORDER BY 1 DESC`,[id]);
    if (data) {
      res.status(httpStatus.OK).json({
        data: data[0],
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
};

async function getOneUser(req, res){
  try {
    const id = req.params.id;

    const oneUser = await conection.execute(`SELECT * FROM user WHERE id = ?`,[id]);

    if(oneUser){
      res.status(httpStatus.OK).json({
        data: oneUser,
        module: Module
      })
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
}

async function updateuser(req, res) {
  try {
    const { name, rol, user, state } = req.body;
    const id = req.params.id;

    const update = conection.execute(
      `UPDATE user SET name = ?, rol = ?, user=?, state=? where id = ${id}`,
      [name, rol, user, state]
    );

    if (update) {
      res.status(httpStatus.OK).json({
        message: "Usuario actualizado.",
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
}

async function deleteUser(req, res){
  try {
    const id = req.params.id;
    const deleteUser = await conection.execute(`DELETE FROM user WHERE id = ?`,[id]);

    if(deleteUser){
      res.status(httpStatus.OK).json({
        message: "Usuario eliminado.",
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      module: Module,
    });
  }
}

module.exports = {
  saveUser,
  getUser,
  getOneUser,
  updateuser,
  deleteUser
};
