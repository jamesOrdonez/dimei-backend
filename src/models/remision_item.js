const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const RemisionItem = sequelize.define("RemisionItem", {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    fk_item: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    fk_remision: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    fkUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    fk_remision_product: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },

    status: {
        type: DataTypes.ENUM('Completo', 'Pendiente'),
        allowNull: false,
        defaultValue: 'Completo',
    }

}, {
    tableName: "remision_item",
    timestamps: false,
});

module.exports = RemisionItem;