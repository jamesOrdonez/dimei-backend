const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const ItemProduct = require("./item_product");

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

Product.hasMany(ItemProduct, {
    foreignKey: "product",
    as: "productItem"
})

const GroupProduct = require("./group_product");
Product.belongsTo(GroupProduct, {
    foreignKey: "fk_group_product",
    as: "group_product"
});

module.exports = Product;