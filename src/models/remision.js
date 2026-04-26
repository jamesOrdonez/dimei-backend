const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const Remision = sequelize.define("Remision", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    fkUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    company: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },

    fk_proyect: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }

}, {
    tableName: "remision",
    timestamps: false,
});

const RemisionItem = require("./remision_item");
const RemisionProduct = require("./remision_product");
const Product = require("./product");
const Item = require("./item");
const User = require("./user");
const Proyect = require("./proyect");

Remision.hasMany(RemisionItem, {
    foreignKey: "fk_remision",
    as: "remisionItems"
});

Remision.hasMany(RemisionProduct, {
    foreignKey: "fk_remision",
    as: "remisionProducts"
});

// Inverse associations
RemisionItem.belongsTo(Remision, {
    foreignKey: "fk_remision",
    as: "remision"
});

RemisionProduct.belongsTo(Remision, {
    foreignKey: "fk_remision",
    as: "remision"
});

RemisionProduct.belongsTo(Product, {
    foreignKey: "fk_product",
    as: "product"
});

Remision.belongsTo(User, {
    foreignKey: "fkUser",
    as: "user"
});

Remision.belongsTo(Proyect, {
    foreignKey: "fk_proyect",
    as: "proyect"
});

RemisionItem.belongsTo(Item, {
    foreignKey: "fk_item",
    as: "item"
});

module.exports = Remision;