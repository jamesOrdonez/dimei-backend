const { DataTypes } = require('sequelize');
const sequelize = require('../db/conection');

const group_product = sequelize.define('group_product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    state: {
        type: DataTypes.TINYINT,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false,
});
module.exports = group_product;