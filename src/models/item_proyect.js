const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const item_proyect = sequelize.define(
  "item_proyect",
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

module.exports = item_proyect;
