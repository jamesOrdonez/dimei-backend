const httpStatus = require("http-status");
const Item = require("../models/item");
const ItemGroup = require("../models/itemGroup");
const UnitOfMeasure = require("../models/unitOfMeasure");
const Client = require("../models/clients");
const Module = "item";
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const uploadsDir = path.join(__dirname, "../../uploads");
const itemUploadsDir = path.join(uploadsDir, "items");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure items uploads directory exists
if (!fs.existsSync(itemUploadsDir)) {
  fs.mkdirSync(itemUploadsDir, { recursive: true });
}

// Crear item
async function saveItems(req, res) {
  try {
    let img = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      img = `item-${Date.now()}${ext}`;
      fs.writeFileSync(path.join(itemUploadsDir, img), req.file.buffer);
    }

    const item = await Item.create({ ...req.body, img });

    res.status(httpStatus.CREATED).json({
      message: "Registro creado",
      module: Module,
      data: item,
    });
  } catch (error) {
    console.error("❌ ERROR AL INSERTAR ITEM:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      error: error.message,
      module: Module,
    });
  }
}

// Obtener todos los items de una compañía
async function getItems(req, res) {
  try {
    const companyId = req.params.id;
    const items = await Item.findAll({
      where: { company: companyId },
      order: [[{ model: ItemGroup, as: "ItemGroup" }, "name", "ASC"]],
      include: [
        { model: ItemGroup, attributes: ["id", "name"], as: "ItemGroup" },
        { model: UnitOfMeasure, attributes: ["id", "unitOfMeasure"], as: "UnitOfMeasure" },
        { model: Client, attributes: ["id", "nombre"], as: "Proveedor" },
      ],
    });

    res.status(httpStatus.OK).json({ data: items, module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      error: error.message,
      module: Module,
    });
  }
}

// Obtener un item por ID
async function getOneItem(req, res) {
  try {
    const id = req.params.id;
    const item = await Item.findByPk(id, {
      include: [
        { model: ItemGroup, attributes: ["id", "name"], as: "ItemGroup" },
        { model: UnitOfMeasure, attributes: ["id", "unitOfMeasure"], as: "UnitOfMeasure" },
        { model: Client, attributes: ["id", "nombre"], as: "Proveedor" },
      ],
    });

    if (!item) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Item no encontrado",
        module: Module,
      });
    }

    res.status(httpStatus.OK).json({
      data: item,
      module: Module,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: Module,
    });
  }
}

// Actualizar item
async function updateItem(req, res) {
  try {
    const id = req.params.id;
    const { img: imgFromBody, ...bodyFields } = req.body;
    const updates = { ...bodyFields };

    if (req.file) {
      // Case 1: new image uploaded — replace the old one
      const currentItem = await Item.findByPk(id);
      if (currentItem && currentItem.img) {
        const oldPath = path.join(itemUploadsDir, currentItem.img);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      const ext = path.extname(req.file.originalname);
      const filename = `item-${Date.now()}${ext}`;
      fs.writeFileSync(path.join(itemUploadsDir, filename), req.file.buffer);
      updates.img = filename;
    } else if (imgFromBody === '') {
      // Case 2: user cleared the image → delete file and set null
      const currentItem = await Item.findByPk(id);
      if (currentItem && currentItem.img) {
        const oldPath = path.join(itemUploadsDir, currentItem.img);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.img = null;
    }
    // Case 3: imgFromBody undefined → user didn't touch image, keep existing

    // Check if record exists first to be more accurate with errors
    const itemToUpdate = await Item.findByPk(id);
    if (!itemToUpdate) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Item no encontrado",
        module: Module,
      });
    }

    await itemToUpdate.update(updates);

    const updatedItem = await Item.findByPk(id, {
      include: [
        { model: ItemGroup, attributes: ["id", "name"], as: "ItemGroup" },
        { model: UnitOfMeasure, attributes: ["id", "unitOfMeasure"], as: "UnitOfMeasure" },
        { model: Client, attributes: ["id", "nombre"], as: "Proveedor" },
      ],
    });

    res.status(httpStatus.OK).json({
      message: "Registro actualizado",
      data: updatedItem,
      module: Module,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: Module,
    });
  }
}

// Eliminar item
async function deleteItem(req, res) {
  try {
    const id = req.params.id;

    // Get item to delete physical file
    const item = await Item.findByPk(id);
    if (item && item.img) {
      const filePath = path.join(itemUploadsDir, item.img);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const deleted = await Item.destroy({ where: { id } });

    if (!deleted) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Item no encontrado",
        module: Module,
      });
    }

    res.status(httpStatus.OK).json({
      message: "Registro eliminado",
      module: Module,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: Module,
    });
  }
}

// Entrada de items (sumar cantidad)
async function entranceItems(req, res) {
  try {
    const id = req.params.id;
    const { entranceAmount } = req.body;

    const item = await Item.findByPk(id);
    if (!item) return res.status(httpStatus.NOT_FOUND).json({ message: "Item no encontrado", module: Module });

    const currentAmount = Number(item.amount || 0);
    const addAmount = Number(entranceAmount || 0);
    const newAmount = currentAmount + addAmount;

    await item.update({ amount: newAmount });

    const InventoryLog = require("../models/InventoryLog");
    if (req.body.fkUser) {
      await InventoryLog.create({
        item_id: id,
        action_type: "ENTRADA",
        action_source: "MANUAL",
        destination_detail: "Entrada manual",
        quantity: addAmount,
        user_id: req.body.fkUser,
        date: new Date()
      });
    }

    res.status(httpStatus.OK).json({
      message: "Cantidad actualizada",
      module: Module,
      data: item,
    });
  } catch (error) {
    console.error("❌ ERROR EN ENTRADA DE ITEMS:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: Module,
    });
  }
}

// Salida de items (restar cantidad)
async function exitItems(req, res) {
  try {
    const id = req.params.id;
    const { exitAmount } = req.body;

    const item = await Item.findByPk(id);
    if (!item) return res.status(httpStatus.NOT_FOUND).json({ message: "Item no encontrado", module: Module });

    const currentAmount = Number(item.amount || 0);
    const subAmount = Number(exitAmount || 0);
    const newAmount = currentAmount - subAmount;

    await item.update({ amount: newAmount });

    const InventoryLog = require("../models/InventoryLog");
    if (req.body.fkUser) {
      await InventoryLog.create({
        item_id: id,
        action_type: "SALIDA",
        action_source: "MANUAL",
        destination_detail: "Salida manual",
        quantity: subAmount,
        user_id: req.body.fkUser,
        date: new Date()
      });
    }

    res.status(httpStatus.OK).json({
      message: "Cantidad actualizada",
      module: Module,
      data: item,
    });
  } catch (error) {
    console.error("❌ ERROR EN SALIDA DE ITEMS:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno en el servidor",
      module: Module,
    });
  }
}

// Obtener imagen
async function getItemImage(req, res) {
  try {
    const id = req.params.id;
    const item = await Item.findByPk(id, { attributes: ["img"] });

    if (!item || !item.img) return res.status(404).end();

    const filePath = path.join(itemUploadsDir, item.img);
    if (!fs.existsSync(filePath)) return res.status(404).end();

    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno", error });
  }
}

// Obtener historial de item
async function getInventoryLogByItem(req, res) {
  try {
    const id = req.params.id;
    const InventoryLog = require("../models/InventoryLog");
    const User = require("../models/user");
    const logs = await InventoryLog.findAll({
      where: { item_id: id },
      order: [['date', 'DESC']],
      include: [
        { model: User, as: "ChangedBy", attributes: ["id", "name"] }
      ]
    });
    res.status(httpStatus.OK).json({ data: logs, module: Module });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error interno",
      module: Module,
    });
  }
}

module.exports = {
  saveItems,
  getItems,
  getOneItem,
  updateItem,
  deleteItem,
  entranceItems,
  exitItems,
  getItemImage,
  getInventoryLogByItem,
};