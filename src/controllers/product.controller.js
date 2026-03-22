const httpStatus = require("http-status");
const Product = require("../models/product");
const ModuleName = "product";
const ItemProduct = require("../models/item_product");
const Item = require("../models/item");

async function getproduct(req, res) {
  try {
    const companyId = req.params.id;
    const products = await Product.findAll({
      where: { company: companyId },
      order: [["id", "DESC"]],
    });

    res.status(httpStatus.OK).json({
      data: products,
      module: ModuleName,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: ModuleName,
    });
  }
}

async function getOneProduct(req, res) {
  try {
    const id = req.params.id;
    const productInstance = await Product.findByPk(id, {
      include: [
        {
          model: ItemProduct,
          attributes: [['item', 'id'], 'quantity'],
          as: 'productItem',
          include: [{
            model: Item,
            as: 'itemData',
            attributes: ['group_item']
          }]
        }
      ]
    });

    if (!productInstance) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Producto no encontrado",
        module: ModuleName,
      });
    }

    const product = productInstance.get({ plain: true });
    product.net_items = product.productItem;

    // Set group_item from the first item if exists
    if (product.net_items && product.net_items.length > 0) {
      product.group_item = product.net_items[0].itemData?.group_item;
      // Cleanup itemData after getting group_item
      product.net_items.forEach(item => delete item.itemData);
    }

    delete product.productItem;

    res.status(httpStatus.OK).json({
      data: product,
      module: ModuleName,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: ModuleName,
    });
  }
}

async function saveproduct(req, res) {
  try {
    const data = req.body;

    const newProduct = await Product.create(data);

    if (data.net_items && data.net_items.length > 0) {

      const items = data.net_items.map(item => ({
        product: newProduct.id,
        item: item.id,
        quantity: item.quantity,
        company: data.company
      }));

      await ItemProduct.bulkCreate(items);
    }

    res.status(httpStatus.CREATED).json({
      message: "Registro creado",
      data: { id: newProduct.id },
      module: ModuleName
    });

  } catch (error) {
    console.error(error);

    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      error: error.message,
      module: ModuleName
    });
  }
}

async function updateProduct(req, res) {
  try {
    const id = req.params.id;
    const data = req.body;

    const productToUpdate = await Product.findByPk(id);

    if (!productToUpdate) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Producto no encontrado",
        module: ModuleName,
      });
    }

    await Product.update(data, { where: { id } });

    if (data.net_items) {
      await ItemProduct.destroy({ where: { product: id } });

      if (data.net_items.length > 0) {
        const items = data.net_items.map(item => ({
          product: id,
          item: item.id,
          quantity: item.quantity,
          company: data.company
        }));

        await ItemProduct.bulkCreate(items);
      }
    }

    const updatedProduct = await Product.findByPk(id);

    res.status(httpStatus.OK).json({
      message: "Registro actualizado",
      module: ModuleName,
      data: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: ModuleName,
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const id = req.params.id;

    await ItemProduct.destroy({ where: { product: id } });

    const deleted = await Product.destroy({ where: { id } });

    if (!deleted) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Producto no encontrado",
        module: ModuleName,
      });
    }

    res.status(httpStatus.OK).json({
      message: "Registro eliminado correctamente",
      module: ModuleName,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: ModuleName,
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