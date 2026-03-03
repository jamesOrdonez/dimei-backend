const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const ItemProduct = sequelize.define("ItemProduct", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    product: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    item: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    company: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: "item_product",
    timestamps: false,
});

module.exports = ItemProduct;