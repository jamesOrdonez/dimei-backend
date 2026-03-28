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

Remision.hasMany(RemisionItem, {
    foreignKey: "fk_remision",
    as: "remisionItems"
});

Remision.hasMany(RemisionProduct, {
    foreignKey: "fk_remision",
    as: "remisionProducts"
});

module.exports = Remision;