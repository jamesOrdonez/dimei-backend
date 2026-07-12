const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const User = require("./user");
const Item = require("./item");
const Product = require("./product");

const InventoryLog = sequelize.define(
    "InventoryLog",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        item_id: { type: DataTypes.INTEGER, allowNull: true },
        product_id: { type: DataTypes.INTEGER, allowNull: true },
        action_type: { type: DataTypes.ENUM("ENTRADA", "SALIDA"), allowNull: false },
        action_source: { type: DataTypes.STRING, allowNull: false },
        destination_detail: { type: DataTypes.STRING, allowNull: true },
        quantity: { type: DataTypes.FLOAT, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
        tableName: "inventory_log",
        timestamps: false,
    }
);

InventoryLog.belongsTo(User, { foreignKey: "user_id", as: "ChangedBy" });
User.hasMany(InventoryLog, { foreignKey: "user_id", as: "inventoryLogs" });

InventoryLog.belongsTo(Item, { foreignKey: "item_id", as: "ItemInfo" });
Item.hasMany(InventoryLog, { foreignKey: "item_id", as: "logs" });

InventoryLog.belongsTo(Product, { foreignKey: "product_id", as: "ProductInfo" });
Product.hasMany(InventoryLog, { foreignKey: "product_id", as: "logs" });

module.exports = InventoryLog;
