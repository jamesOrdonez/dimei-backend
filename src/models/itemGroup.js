const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const Item = require("./item"); // Importamos Item directamente para la asociación

const ItemGroup = sequelize.define(
    "ItemGroup",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false },
        state: { type: DataTypes.STRING, allowNull: false },
        company: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
        tableName: "item_group",
        timestamps: false,
    }
);

// Asociación dentro del mismo archivo
ItemGroup.hasMany(Item, { foreignKey: "group_item", as: "items" });
Item.belongsTo(ItemGroup, { foreignKey: "group_item", as: "ItemGroup" });

module.exports = ItemGroup;