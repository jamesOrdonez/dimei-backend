const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const RemisionProduct = sequelize.define("RemisionProduct", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    fk_remision: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    fk_product: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    status: {
        type: DataTypes.ENUM('Completo', 'Pendiente'),
        allowNull: false,
        defaultValue: 'Completo',
    }

}, {
    tableName: "remision_product",
    timestamps: false,
});

module.exports = RemisionProduct;
