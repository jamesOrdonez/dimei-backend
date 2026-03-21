const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const proyect = require("../models/proyect");
const Product = require("../models/product");

const product_proyect = sequelize.define(
  "product_proyect",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true,
    },
    product: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    proyect: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  },
);

product_proyect.belongsTo(Product, {
  foreignKey: "product",
  as: "productData",
});

module.exports = product_proyect;
