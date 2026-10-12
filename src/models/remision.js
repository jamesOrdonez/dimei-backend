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
    },

    customer_signature: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
    },

    customer_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },

    signed_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    client_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
    }

}, {
    tableName: "remision",
    timestamps: false,
});

// Auto-ensure client_name exists in remision table
sequelize.authenticate().then(async () => {
    try {
        const [cols] = await sequelize.query("SHOW COLUMNS FROM remision LIKE 'client_name'");
        if (cols && cols.length === 0) {
            await sequelize.query("ALTER TABLE remision ADD COLUMN client_name VARCHAR(255) NULL");
            console.log("Column client_name added to remision table");
        }
    } catch (err) {
        console.error("Error ensuring client_name in remision:", err.message);
    }
}).catch(() => {});

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