const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const TypeDriveSystem = sequelize.define(
  "typeDriveSystem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    typeDriveSystem: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  },
);

module.exports = TypeDriveSystem;
