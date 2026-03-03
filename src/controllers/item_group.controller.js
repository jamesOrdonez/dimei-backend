const httpStatus = require("http-status");
const ItemGroup = require("../models/itemGroup");
const Module = "item_group";

async function saveItem(req, res) {
  try {
    const { name, state, company } = req.body;
    const item = await ItemGroup.create({ name, state, company });

    res.status(httpStatus.CREATED).json({
      message: "Registro guardado",
      module: Module,
      data: item,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error.message}`,
      module: Module,
    });
  }
}

async function getItemGroup(req, res) {
  try {
    const companyId = req.params.id;
    const items = await ItemGroup.findAll({
      where: { company: companyId },
      order: [["id", "DESC"]],
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

async function getOneItemGroup(req, res) {
  try {
    const id = req.params.id;
    const item = await ItemGroup.findByPk(id);

    if (item) {
      res.status(httpStatus.OK).json({
        data: item,
        module: Module,
      });
    } else {
      res.status(httpStatus.NOT_FOUND).json({
        message: "Item not found",
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

async function updateItemGroup(req, res) {
  try {
    const { name, state } = req.body;
    const id = req.params.id;

    const [updated] = await ItemGroup.update(
      { name, state },
      { where: { id } }
    );

    if (updated) {
      const updatedItem = await ItemGroup.findByPk(id);
      res.status(httpStatus.OK).json({
        message: "Registro actualizado",
        module: Module,
        data: updatedItem,
      });
    } else {
      res.status(httpStatus.NOT_FOUND).json({
        message: "Item no encontrado",
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

async function deleteItemGroup(req, res) {
  try {
    const id = req.params.id;
    const deleted = await ItemGroup.destroy({ where: { id } });

    if (deleted) {
      res.status(httpStatus.OK).json({
        message: "Registro eliminado",
        module: Module,
      });
    } else {
      res.status(httpStatus.NOT_FOUND).json({
        message: "Item no encontrado",
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
  saveItem,
  getItemGroup,
  getOneItemGroup,
  updateItemGroup,
  deleteItemGroup,
};