const httpStatus = require("http-status");
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
              attributes: ["id", "description"],
              as: "itemData",
            },
          ],
        },
      ],
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
        products: (productProyect || []).map((pp) => ({
          id: pp.id,
          product_id: pp.productData?.id,
          product_name: pp.productData?.name,
          quantity: pp.quantity,
        })),
        items: (itemProyect || []).map((ip) => ({
          id: ip.id,
          item_id: ip.itemData?.id,
          item_name: ip.itemData?.description,
          quantity: ip.quantity,
        })),
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

module.exports = {
  save,
  getProject,
  getOneProject,
};
