const conection = require("../db/conection");
const httpStatus = require("http-status");
const Module = "product";

async function getproduct(req, res) {
  try {
    const id = req.params.id;
    const product = await conection.execute(
      `SELECT * FROM product WHERE company = ? ORDER BY 1 DESC`,
      [id]
    );
    if (product) {
      res.status(httpStatus.OK).json({
        data: product[0],
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

async function getOneProduct(req, res) {
  try {
    const id = req.params.id;
    const data = conection.execute(`SELECT * FROM product WHERE id = ?`, [id]);
    if (data) {
      res.status(httpStatus.OK).json({
        data: data,
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

async function saveproduct(req, res) {
  try {
    const { name, description, user, company } = req.body;
    const saveproduct = await conection.execute(
      `INSERT INTO product (name, description, user, company) VALUE (?,?,?,?)`,
      [name, description, user, company]
    );
    if (saveproduct) {
      res.status(httpStatus.CREATED).json({
        message: "Registro creado",
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

async function updateProduct(req, res) {
  try {
    const { name, description } = req.body;
    const id = req.params.id;

    const update = await conection.execute(
      `UPDATE product SET name=?, description=? where id=?`,
      [name, description, id]
    );
    if (update) {
      res.status(httpStatus.OK).json({
        message: "Registro actualizado",
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

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    // Eliminar relación primero (si existe)
    await conection.execute("DELETE FROM item_product WHERE product = ?", [id]);

    // Eliminar producto
    const [result] = await conection.execute(
      "DELETE FROM product WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Producto no encontrado",
        module: Module,
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Registro eliminado correctamente",
      module: Module,
    });
  } catch (error) {
    console.error(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: Module,
    });
  }
}

module.exports = {
  getproduct,
  getOneProduct,
  saveproduct,
  updateProduct,
  deleteProduct,
};
