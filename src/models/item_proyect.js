const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const Item = require("../models/item");

const item_proyect = sequelize.define(
  "item_proyect",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true,
    },
    item: {
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

item_proyect.belongsTo(Item, {
  foreignKey: "item",
  as: "itemData",
});

module.exports = item_proyect;
