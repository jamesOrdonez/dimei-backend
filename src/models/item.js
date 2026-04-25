const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const Client = require("./clients");

const Item = sequelize.define(
    "Item",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        description: { type: DataTypes.STRING, allowNull: true },
        amount: { type: DataTypes.FLOAT, allowNull: true },
        group_item: { type: DataTypes.INTEGER, allowNull: true },
        position1: { type: DataTypes.STRING, allowNull: true },
        position2: { type: DataTypes.STRING, allowNull: true },
        position3: { type: DataTypes.STRING, allowNull: true },
        price: { type: DataTypes.FLOAT, allowNull: true },
        unitOfMeasure: { type: DataTypes.INTEGER, allowNull: true },
        user: { type: DataTypes.INTEGER, allowNull: true },
        company: { type: DataTypes.INTEGER, allowNull: true },
        img: { type: DataTypes.STRING, allowNull: true },
        low_stock: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 3 },
        proveedor_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
        tableName: "item",
        timestamps: false,
    }
);

Item.belongsTo(Client, { foreignKey: 'proveedor_id', as: 'Proveedor' });

module.exports = Item;