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
        fk_group_product: { type: DataTypes.INTEGER, allowNull: true },
        variable: { type: DataTypes.INTEGER, allowNull: true },
        value1: { type: DataTypes.INTEGER, allowNull: true },
        mathOperation: { type: DataTypes.STRING, allowNull: true },
        value2: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
        tableName: "product",
        timestamps: false,
    }
);

module.exports = Product;