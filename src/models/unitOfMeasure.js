const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const Item = require("./item"); // Importamos Item directamente

const UnitOfMeasure = sequelize.define(
    "UnitOfMeasure",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        unitOfMeasure: { type: DataTypes.STRING, allowNull: false },
        company: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
        tableName: "unitofmeasure",
        timestamps: false,
    }
);

// Asociación dentro del mismo archivo
UnitOfMeasure.hasMany(Item, { foreignKey: "unitOfMeasure", as: "items" });
Item.belongsTo(UnitOfMeasure, { foreignKey: "unitOfMeasure", as: "UnitOfMeasure" });

module.exports = UnitOfMeasure;