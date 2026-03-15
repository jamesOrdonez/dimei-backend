const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const ElevatorType = sequelize.define(
  "elevatorType",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    elevatorType: {
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

module.exports = ElevatorType;
