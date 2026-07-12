const httpStatus = require("http-status");
const fs = require("fs");
const path = require("path");
const model = require("../models/proyect");
const ElevatorType = require("../models/elevatorType");
const TypeDriveSystem = require("../models/typeDriveSystem");
const Module = "proyect";
const { col, Op } = require("sequelize");
const Client = require("../models/clients");
const product_proyect = require("../models/product_proyect")
const item_proyect = require("../models/item_proyect");
const Product = require("../models/product");
const Item = require("../models/item");
const ItemProduct = require("../models/item_product");
const RemisionProduct = require("../models/remision_product");
const RemisionItem = require("../models/remision_item");
const Remision = require("../models/remision");
const MaintenanceReport = require("../models/maintenanceReport");
const User = require("../models/user");

//* id del item/producto, nombre, cantidad, grupo

async function save(req, res) {
  try {
    const data = req.body;
    const saved = await model.create({
      ...data,
      tipo: data.tipo || 'proyecto'
    });

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
    const tipo = req.query.tipo || 'proyecto';
    const customerId = req.query.customerId;

    const where = { company: id, tipo: tipo };
    if (customerId) where.customerId = customerId;

    const projects = await model.findAll({
      where,
      order: [["id", "DESC"]],
      include: [
        {
          model: ElevatorType,
          attributes: ["id", "elevatorType", "question_group_id"],
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
          model: MaintenanceReport,
          as: "maintenances",
          include: [{ model: User, as: "technicianData", attributes: ["name"] }]
        }
      ],
      order: [["id", "DESC"], [{ model: MaintenanceReport, as: "maintenances" }, "date", "DESC"]],
    });

    const formattedProjects = projects.map((project) => {
      const data = project.toJSON();
      const lastMaintenance = data.maintenances?.[0] || null;

      const {
        elevatorTypeData,
        driveSystemData,
        customerData,
        maintenances,
        ...rest
      } = data;

      return {
        ...rest,
        elevatorType: data.elevatorType,
        typeDriveSystem: data.typeDriveSystem,
        customerId: data.customerId,
        elevatorTypeName: elevatorTypeData?.elevatorType || null,
        typeDriveSystemName: driveSystemData?.typeDriveSystem || null,
        customerName: customerData?.nombre || null,
        questionGroupId: elevatorTypeData?.question_group_id || null,
        displayLabel: `Proyecto #${data.id} - Cliente: ${customerData?.nombre || 'S/N'} - Sist: ${driveSystemData?.typeDriveSystem || 'S/N'}`,
        lastMaintenance: lastMaintenance ? {
          id: lastMaintenance.id,
          date: lastMaintenance.date,
          technician: lastMaintenance.technicianData?.name || 'Desconocido'
        } : null
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
          attributes: ["id", "elevatorType", "question_group_id"],
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
              attributes: ["id", "name", "description", "por_metros_cuadrados"],
              as: "productData",
              include: [
                {
                  model: ItemProduct,
                  as: "productItem",
                  include: [
                    {
                      model: Item,
                      attributes: ["id", "description", "price", "position1", "position2", "position3"],
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
              attributes: ["id", "description", "price", "position1", "position2", "position3"],
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
        elevatorType: data.elevatorType,
        typeDriveSystem: data.typeDriveSystem,
        customerId: data.customerId,
        elevatorTypeName: elevatorTypeData?.elevatorType || null,
        questionGroupId: elevatorTypeData?.question_group_id || null,
        typeDriveSystemName: driveSystemData?.typeDriveSystem || null,
        customerName: customerData?.nombre || null,
        necesita_encerramiento: data.necesita_encerramiento || 0,
        metros_cuadrados: data.metros_cuadrados || null,
        products: (productProyect || []).map((pp) => {
          const productItems = pp.productData?.productItem || [];
          const itemsData = productItems.map(pi => {
            const price = pi.itemData?.price || 0;
            const quantity = pi.quantity || 0;
            return {
              item_id: pi.itemData?.id,
              item_name: pi.itemData?.description,
              quantity: quantity,
              variable: pi.variable || 0,
              value1: pi.value1 || null,
              value2: pi.value2 || null,
              price: price,
              total: quantity * price,
              location: [pi.itemData?.position1, pi.itemData?.position2, pi.itemData?.position3].filter(Boolean).join(' - ') || 'S/N'
            };
          });
          const productTotal = itemsData.reduce((acc, curr) => acc + curr.total, 0);

          return {
            id: pp.id,
            product_id: pp.productData?.id,
            product_name: pp.productData?.name,
            product_description: pp.productData?.description,
            quantity: pp.quantity,
            por_metros_cuadrados: pp.productData?.por_metros_cuadrados || 0,
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
            total: quantity * price,
            location: [ip.itemData?.position1, ip.itemData?.position2, ip.itemData?.position3].filter(Boolean).join(' - ') || 'S/N'
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

    const items = await Item.findAll({
      where: { company: companyId },
      include: [
        { model: Client, attributes: ["nombre"], as: "Proveedor" }
      ],
      raw: true,
      nest: true,
    });

    const activeProjects = await model.findAll({
      where: { company: companyId, state: { [Op.ne]: 'Creado' } },
      attributes: ['id', 'travel', 'necesita_encerramiento', 'metros_cuadrados'],
      raw: true
    });
    const activeProjectIds = activeProjects.map(p => p.id);
    const activeProjectTravelMap = {};
    const activeProjectEnclosureMap = {};
    activeProjects.forEach(p => {
      activeProjectTravelMap[p.id] = parseFloat(p.travel) || 0;
      activeProjectEnclosureMap[p.id] = {
        necesita_encerramiento: p.necesita_encerramiento === 1 || p.necesita_encerramiento === true,
        metros_cuadrados: parseFloat(p.metros_cuadrados) || 0
      };
    });

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

    const separatedProducts = await product_proyect.findAll({
      include: [
        {
          model: Product,
          as: "productData",
          where: { company: companyId },
          attributes: ["id", "por_metros_cuadrados"],
        }
      ],
      raw: true,
    });

    const productItemsData = await ItemProduct.findAll({
      where: { company: companyId },
      raw: true,
    });

    const productItemMap = {};
    productItemsData.forEach(pi => {
      if (!productItemMap[pi.product]) {
        productItemMap[pi.product] = [];
      }
      productItemMap[pi.product].push(pi);
    });

    const remissions = await Remision.findAll({
      where: { company: companyId },
      include: [
        { model: RemisionItem, as: "remisionItems" }
      ]
    });

    // Split remissions into direct (standalone items) vs via-product (product components)
    // to avoid double-counting when an item appears in both item_proyect and product_proyect
    const remittedDirectByProject = {};
    const remittedViaProductByProject = {};
    remissions.forEach(rem => {
      const projId = rem.fk_proyect;
      if (!remittedDirectByProject[projId]) remittedDirectByProject[projId] = {};
      if (!remittedViaProductByProject[projId]) remittedViaProductByProject[projId] = {};
      (rem.remisionItems || []).forEach(ri => {
        const itemId = ri.fk_item;
        if (ri.fk_remision_product) {
          // This item was remitted as part of a product
          remittedViaProductByProject[projId][itemId] = (remittedViaProductByProject[projId][itemId] || 0) + ri.quantity;
        } else {
          // This item was remitted directly (standalone)
          remittedDirectByProject[projId][itemId] = (remittedDirectByProject[projId][itemId] || 0) + ri.quantity;
        }
      });
    });

    const separatedPerItemTotal = {};
    const separatedPerItemProject = {};
    const separatedPerItemActive = {};
    const allocationsPerItem = {};

    const addAllocation = (itemId, projId, qty) => {
      if (qty <= 0) return;
      if (!activeProjectIds.includes(projId)) return;
      if (!allocationsPerItem[itemId]) allocationsPerItem[itemId] = [];
      const existing = allocationsPerItem[itemId].find(a => a.projectId === projId);
      if (existing) {
        existing.quantity += qty;
      } else {
        allocationsPerItem[itemId].push({ projectId: projId, quantity: qty });
      }
    };

    // Process direct items — use only direct remissions for discount
    separatedItems.forEach(si => {
      const itemId = si.item;
      const qty = si.quantity || 0;
      const projId = si.proyect;
      if (!activeProjectIds.includes(projId)) return;

      const remitted = remittedDirectByProject[projId]?.[itemId] || 0;
      const netQty = Math.max(0, qty - remitted);

      separatedPerItemTotal[itemId] = (separatedPerItemTotal[itemId] || 0) + netQty;
      separatedPerItemActive[itemId] = (separatedPerItemActive[itemId] || 0) + netQty;

      if (projectId && String(projId) === String(projectId)) {
        separatedPerItemProject[itemId] = (separatedPerItemProject[itemId] || 0) + netQty;
      }
      addAllocation(itemId, projId, netQty);
    });

    // Process product components — use only via-product remissions for discount
    separatedProducts.forEach(sp => {
      const prodId = sp.product;
      const projId = sp.proyect;
      if (!activeProjectIds.includes(projId)) return;

      const enclosureInfo = activeProjectEnclosureMap[projId];
      const necesitaEncerramiento = enclosureInfo?.necesita_encerramiento;
      const metrosCuadrados = enclosureInfo?.metros_cuadrados || 0;
      const esPorMetros = sp['productData.por_metros_cuadrados'] === 1 || sp['productData.por_metros_cuadrados'] === true;

      const projQty = (necesitaEncerramiento && esPorMetros && metrosCuadrados > 0)
        ? (Number(sp.quantity) || 0) * metrosCuadrados
        : (Number(sp.quantity) || 0);

      const itemsInProd = productItemMap[prodId] || [];
      itemsInProd.forEach(pi => {
        let itemQtyPerProduct = pi.quantity || 0;
        if (pi.variable === 1 || pi.variable === '1') {
          const travelVal = activeProjectTravelMap[projId] || 0;
          itemQtyPerProduct = parseFloat(((travelVal * (Number(pi.value1) || 0)) + (Number(pi.value2) || 0)).toFixed(2));
        }

        const totalItemsSeparated = projQty * itemQtyPerProduct;
        const itemId = pi.item;
        const remitted = remittedViaProductByProject[projId]?.[itemId] || 0;
        const netQty = Math.max(0, totalItemsSeparated - remitted);

        separatedPerItemTotal[itemId] = (separatedPerItemTotal[itemId] || 0) + netQty;
        separatedPerItemActive[itemId] = (separatedPerItemActive[itemId] || 0) + netQty;

        if (projectId && String(projId) === String(projectId)) {
          separatedPerItemProject[itemId] = (separatedPerItemProject[itemId] || 0) + netQty;
        }
        addAllocation(itemId, projId, netQty);
      });
    });

    const comparison = items.map(it => {
      const totalSeparated = separatedPerItemTotal[it.id] || 0;
      const activeSeparated = separatedPerItemActive[it.id] || 0;
      const projectSeparated = projectId ? (separatedPerItemProject[it.id] || 0) : totalSeparated;
      const amount = it.amount || 0;

      return {
        id: it.id,
        item_name: it.description,
        total_inventory: amount,
        separated_inventory: projectSeparated,
        available_inventory: amount - totalSeparated,
        available_inventory_active: amount - activeSeparated,
        category: it.group_item,
        price: it.price || 0,
        low_stock: it.low_stock || 0,
        proveedor: it.Proveedor?.nombre || '-',
        allocations: allocationsPerItem[it.id] || [],
        position1: it.position1,
        position2: it.position2,
        position3: it.position3,
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

async function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await model.update(data, {
      where: { id }
    });

    if (updated[0] > 0) {
      res.status(httpStatus.OK).json({
        message: "Registro actualizado",
        Module,
      });
    } else {
      res.status(httpStatus.NOT_FOUND).json({
        message: "Registro no encontrado o sin cambios",
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

async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const deleted = await model.destroy({ where: { id } });

    if (deleted) {
      res.status(httpStatus.OK).json({
        message: "Proyecto eliminado exitosamente",
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
  update,
  getProject,
  getOneProject,
  getInventoryComparison,
  updateState,
  uploadSignedAct,
  getSignedAct,
  deleteProject,
};
