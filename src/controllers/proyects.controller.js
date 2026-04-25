const httpStatus = require("http-status");
const fs = require("fs");
const path = require("path");
const model = require("../models/proyect");
const ElevatorType = require("../models/elevatorType");
const TypeDriveSystem = require("../models/typeDriveSystem");
const Module = "proyect";
const { col } = require("sequelize");
const Client = require("../models/clients");
const product_proyect = require("../models/product_proyect")
const item_proyect = require("../models/item_proyect");
const Product = require("../models/product");
const Item = require("../models/item");
const ItemProduct = require("../models/item_product");
const RemisionProduct = require("../models/remision_product");
const RemisionItem = require("../models/remision_item");
const Remision = require("../models/remision");

//* id del item/producto, nombre, cantidad, grupo

async function save(req, res) {
  try {
    const data = req.body;
    const saved = await model.create(data);

    if (saved) {
      res.status(httpStatus.OK).json({
        message: "Registro creado",
        Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      Module,
    });
  }
}

async function getProject(req, res) {
  try {
    const id = req.params.id;

    const projects = await model.findAll({
      where: { company: id },
      order: [["id", "DESC"]],
      include: [
        {
          model: ElevatorType,
          attributes: ["id", "elevatorType"],
          as: "elevatorTypeData",
        },
        {
          model: TypeDriveSystem,
          attributes: ["id", "typeDriveSystem"],
          as: "driveSystemData",
        },
        {
          model: Client,
          attributes: ["id", "nombre"],
          as: "customerData",
        },
      ],
    });

    const formattedProjects = projects.map((project) => {
      const data = project.toJSON();

      const {
        elevatorTypeData,
        driveSystemData,
        customerData,
        customerId,
        user,
        ...rest
      } = data;

      return {
        ...rest,
        elevatorType: elevatorTypeData?.elevatorType || null,
        typeDriveSystem: driveSystemData?.typeDriveSystem || null,
        customer: customerData?.nombre || null,
      };
    });

    res.status(httpStatus.OK).json({
      data: formattedProjects,
      Module,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      Module,
    });
  }
}

async function getOneProject(req, res) {
  try {
    const id = req.params.id;

    const projects = await model.findAll({
      where: { id: id },
      order: [["id", "DESC"]],
      include: [
        {
          model: ElevatorType,
          attributes: ["id", "elevatorType"],
          as: "elevatorTypeData",
        },
        {
          model: TypeDriveSystem,
          attributes: ["id", "typeDriveSystem"],
          as: "driveSystemData",
        },
        {
          model: Client,
          attributes: ["id", "nombre"],
          as: "customerData",
        },
        {
          model: product_proyect,
          attributes: ["id", "quantity"],
          as: "productProyect",
          include: [
            {
              model: Product,
              attributes: ["id", "name"],
              as: "productData",
              include: [
                {
                  model: ItemProduct,
                  as: "productItem",
                  include: [
                    {
                      model: Item,
                      attributes: ["id", "description", "price"],
                      as: "itemData",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: item_proyect,
          attributes: ["id", "quantity"],
          as: "itemProyect",
          include: [
            {
              model: Item,
              attributes: ["id", "description", "price"],
              as: "itemData",
            },
          ],
        },
      ],
    });

    if (!projects || projects.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Proyecto no encontrado" });
    }

    // Obtener remisiones del proyecto para calcular cantidades ya remitidas
    const remissions = await Remision.findAll({
      where: { fk_proyect: id },
      include: [
        { model: RemisionProduct, as: "remisionProducts" }, // Asumiendo que 'as' sea este, verificaré
        { model: RemisionItem, as: "remisionItems" },
      ]
    });

    // Mapear totales remisionados por producto e ítem agrupando por estado
    const remittedProductsDetail = {};
    const remittedItemsDetail = {};
    const remittedProductsTotal = {};
    const remittedItemsTotal = {};

    remissions.forEach(rem => {
      (rem.remisionProducts || []).forEach(rp => {
        const id = rp.fk_product;
        const status = rp.status;
        const qty = rp.quantity;

        remittedProductsTotal[id] = (remittedProductsTotal[id] || 0) + qty;

        if (!remittedProductsDetail[id]) remittedProductsDetail[id] = [];
        const existing = remittedProductsDetail[id].find(x => x.status === status);
        if (existing) existing.quantity += qty;
        else remittedProductsDetail[id].push({ status, quantity: qty });
      });

      (rem.remisionItems || []).forEach(ri => {
        // Solo contar ítems directos (sin fk_remision_product)
        if (!ri.fk_remision_product) {
          const id = ri.fk_item;
          const status = ri.status;
          const qty = ri.quantity;

          remittedItemsTotal[id] = (remittedItemsTotal[id] || 0) + qty;

          if (!remittedItemsDetail[id]) remittedItemsDetail[id] = [];
          const existing = remittedItemsDetail[id].find(x => x.status === status);
          if (existing) existing.quantity += qty;
          else remittedItemsDetail[id].push({ status, quantity: qty });
        }
      });
    });

    const formattedProjects = projects.map((project) => {
      const data = project.toJSON();
      const {
        elevatorTypeData,
        driveSystemData,
        customerData,
        productProyect,
        itemProyect,
        ...rest
      } = data;

      return {
        ...rest,
        elevatorType: elevatorTypeData?.elevatorType || null,
        typeDriveSystem: driveSystemData?.typeDriveSystem || null,
        customer: customerData?.nombre || null,
        products: (productProyect || []).map((pp) => {
          const productItems = pp.productData?.productItem || [];
          const itemsData = productItems.map(pi => {
            const price = pi.itemData?.price || 0;
            const quantity = pi.quantity || 0;
            return {
              item_id: pi.itemData?.id,
              item_name: pi.itemData?.description,
              quantity: quantity,
              price: price,
              total: quantity * price
            };
          });
          const productTotal = itemsData.reduce((acc, curr) => acc + curr.total, 0);

          return {
            id: pp.id,
            product_id: pp.productData?.id,
            product_name: pp.productData?.name,
            quantity: pp.quantity,
            remitted_quantity: remittedProductsTotal[pp.productData?.id] || 0,
            remitted_details: remittedProductsDetail[pp.productData?.id] || [],
            total_price: productTotal, // Mide el precio unitario del producto basado en sus componentes
            items: itemsData
          };
        }),
        items: (itemProyect || []).map((ip) => {
          const price = ip.itemData?.price || 0;
          const quantity = ip.quantity || 0;
          return {
            id: ip.id,
            item_id: ip.itemData?.id,
            item_name: ip.itemData?.description,
            quantity: quantity,
            remitted_quantity: remittedItemsTotal[ip.itemData?.id] || 0,
            remitted_details: remittedItemsDetail[ip.itemData?.id] || [],
            price: price,
            total: quantity * price
          };
        }),
      };
    });

    res.status(httpStatus.OK).json({
      data: formattedProjects,
      Module,
    });
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      Module,
    });
  }
}

async function getInventoryComparison(req, res) {
  try {
    const companyId = req.params.company;
    const projectId = req.query.projectId;

    // 1. Get all items for the company
    const items = await Item.findAll({
      where: { company: companyId },
      raw: true,
    });

    // 2. Get separated items directly tied to projects
    const separatedItems = await item_proyect.findAll({
      include: [
        {
          model: Item,
          as: "itemData",
          where: { company: companyId },
          attributes: []
        }
      ],
      raw: true,
    });

    // 3. Get separated products tied to projects, and their items
    const separatedProducts = await product_proyect.findAll({
      include: [
        {
          model: Product,
          as: "productData",
          where: { company: companyId },
          attributes: ["id"],
        }
      ],
      raw: true,
    });

    // To compute items separated by products, we need product items mapping
    const productItemsData = await ItemProduct.findAll({
      where: { company: companyId },
      raw: true,
    });

    // Group product items by product ID
    const productItemMap = {};
    productItemsData.forEach(pi => {
      if (!productItemMap[pi.product]) {
        productItemMap[pi.product] = [];
      }
      productItemMap[pi.product].push(pi);
    });

    // Calculate separated quantity per item (Total and Specific Project)
    const separatedPerItemTotal = {};
    const separatedPerItemProject = {};

    // 2a. Add direct items
    separatedItems.forEach(si => {
      const itemId = si.item;
      const qty = si.quantity || 0;
      const projId = si.proyect;

      if (!separatedPerItemTotal[itemId]) separatedPerItemTotal[itemId] = 0;
      separatedPerItemTotal[itemId] += qty;

      if (projectId && String(projId) === String(projectId)) {
        if (!separatedPerItemProject[itemId]) separatedPerItemProject[itemId] = 0;
        separatedPerItemProject[itemId] += qty;
      }
    });

    // 3a. Add items via products
    separatedProducts.forEach(sp => {
      const prodId = sp.product;
      const projQty = sp.quantity || 0;
      const projId = sp.proyect;
      const itemsInProd = productItemMap[prodId] || [];

      itemsInProd.forEach(pi => {
        const itemQtyPerProduct = pi.quantity || 0;
        const totalItemsSeparated = projQty * itemQtyPerProduct;
        const itemId = pi.item;

        if (!separatedPerItemTotal[itemId]) separatedPerItemTotal[itemId] = 0;
        separatedPerItemTotal[itemId] += totalItemsSeparated;

        if (projectId && String(projId) === String(projectId)) {
          if (!separatedPerItemProject[itemId]) separatedPerItemProject[itemId] = 0;
          separatedPerItemProject[itemId] += totalItemsSeparated;
        }
      });
    });

    // Map the result
    const comparison = items.map(it => {
      const totalSeparated = separatedPerItemTotal[it.id] || 0;
      const projectSeparated = projectId ? (separatedPerItemProject[it.id] || 0) : totalSeparated;
      const amount = it.amount || 0;

      return {
        id: it.id,
        item_name: it.description,
        total_inventory: amount,
        separated_inventory: projectSeparated,
        available_inventory: amount - totalSeparated, // Disponibilidad real libre
        category: it.group_item,
        price: it.price || 0
      };
    });

    res.status(httpStatus.OK).json({
      data: comparison,
      Module
    });

  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      Module,
    });
  }
}

async function updateState(req, res) {
  try {
    const { id } = req.params;
    const { state } = req.body;

    const updated = await model.update({ state }, {
      where: { id }
    });

    if (updated[0] > 0) {
      res.status(httpStatus.OK).json({
        message: "Estado del proyecto actualizado",
        Module,
      });
    } else {
      res.status(httpStatus.NOT_FOUND).json({
        message: "Proyecto no encontrado o sin cambios",
        Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      Module,
    });
  }
}

async function uploadSignedAct(req, res) {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "No se ha proporcionado ningún archivo",
        Module,
      });
    }

    const uploadDir = path.join(process.cwd(), "uploads", "documents");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `acta_firmada_proyecto_${id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, filename);

    // Save file to disk
    fs.writeFileSync(filePath, req.file.buffer);

    // Update database with filename
    const updated = await model.update({ signed_act: filename }, {
      where: { id }
    });

    if (updated[0] > 0) {
      res.status(httpStatus.OK).json({
        message: "Acta firmada cargada correctamente",
        Module,
      });
    } else {
      res.status(httpStatus.NOT_FOUND).json({
        message: "Proyecto no encontrado",
        Module,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      Module,
    });
  }
}

async function getSignedAct(req, res) {
  try {
    const { id } = req.params;
    const project = await model.findByPk(id, { attributes: ["signed_act"] });

    if (!project || !project.signed_act) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Acta no encontrada",
        Module,
      });
    }

    const filePath = path.join(process.cwd(), "uploads", "documents", project.signed_act);
    if (!fs.existsSync(filePath)) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Archivo no encontrado en el servidor",
        Module,
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: `Error interno en el servidor: ${error}`,
      Module,
    });
  }
}

module.exports = {
  save,
  getProject,
  getOneProject,
  getInventoryComparison,
  updateState,
  uploadSignedAct,
  getSignedAct,
};
