const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const Module = sequelize.define(
    "Module",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        module: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: "module",
        timestamps: false,
    }
);

module.exports = Module;