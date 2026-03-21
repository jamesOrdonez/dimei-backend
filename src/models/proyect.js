const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const ElevatorType = require("./elevatorType");
const TypeDriveSystem = require("./typeDriveSystem");
const Customer = require("./clients");
const product_proyect = require("../models/product_proyect");
const item_proyect = require("../models/item_proyect");

const Proyect = sequelize.define(
  "proyect",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    user: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    company: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    elevatorType: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    typeDriveSystem: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stopNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    travel: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  },
);

/* ================= RELACIONES ================= */

Proyect.belongsTo(ElevatorType, {
  foreignKey: "elevatorType",
  as: "elevatorTypeData",
});

Proyect.belongsTo(TypeDriveSystem, {
  foreignKey: "typeDriveSystem",
  as: "driveSystemData",
});

Proyect.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customerData",
});

Proyect.belongsTo(product_proyect, {
  foreignKey: "id",
  as: "productProyect"
});

module.exports = Proyect;
