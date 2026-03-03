const httpStatus = require("http-status");
const ItemProduct = require("../models/item_product");
const Module = "item_product";

// Trae los items de un producto
async function getItemProduct(req, res) {
  try {
    const id = req.params.id;

    // Usando Sequelize con JOINs
    const items = await ItemProduct.findAll({
      where: { product: id },
      attributes: ["id", "product", "item", "quantity", "company"],
      include: [
        {

          model: require("../models/product"), // asegúrate de tener modelo Product
          attributes: ["name"],
        },
        {
          model: require("../models/item"), // asegúrate de tener modelo Item
          attributes: ["description"],
        },
      ],
    });

    res.status(httpStatus.OK).json({
      data: items,
      module: Module,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function saveItemProduct(req, res) {
  try {
    const { product, item, quantity, company } = req.body;
    const newItem = await ItemProduct.create({ product, item, quantity, company });

    res.status(httpStatus.CREATED).json({
      message: "Registro creado",
      module: Module,
      data: newItem,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function updateItemProduct(req, res) {
  try {
    const { quantity } = req.body;
    const id = req.params.id;

    const [updated] = await ItemProduct.update(
      { quantity },
      { where: { id } }
    );

    if (updated) {
      const updatedItem = await ItemProduct.findByPk(id);
      res.status(httpStatus.OK).json({
        message: "Registro actualizado",
        module: Module,
        data: updatedItem,
      });
    } else {
      res.status(httpStatus.NOT_FOUND).json({
        message: "Registro no encontrado",
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function deleteItemProduct(req, res) {
  try {
    const id = req.params.id;
    const deleted = await ItemProduct.destroy({ where: { id } });

    if (deleted) {
      res.status(httpStatus.OK).json({
        message: "Registro eliminado",
        module: Module,
      });
    } else {
      res.status(httpStatus.NOT_FOUND).json({
        message: "Registro no encontrado",
        module: Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

module.exports = {
  getItemProduct,
  saveItemProduct,
  updateItemProduct,
  deleteItemProduct,
};