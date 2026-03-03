const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const Company = sequelize.define("Company", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: "company",
    timestamps: false,
});

module.exports = Company;