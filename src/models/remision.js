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
    }

}, {
    tableName: "remision",
    timestamps: false,
});

module.exports = Remision;