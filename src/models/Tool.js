const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const Tool = sequelize.define(
    "Tool",
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
    },
    {
        tableName: "tool",
        timestamps: false,
    }
);

const ItemGroup = require("./itemGroup");
const UnitOfMeasure = require("./unitOfMeasure");

Tool.belongsTo(ItemGroup, { foreignKey: "group_item", as: "ItemGroup" });
Tool.belongsTo(UnitOfMeasure, { foreignKey: "unitOfMeasure", as: "UnitOfMeasure" });

module.exports = Tool;
