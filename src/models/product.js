const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const Product = sequelize.define(
    "Product",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.STRING, allowNull: true },
        user: { type: DataTypes.INTEGER, allowNull: true },
        company: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
        tableName: "product",
        timestamps: false,
    }
);

module.exports = Product;