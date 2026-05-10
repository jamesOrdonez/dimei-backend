const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const Rol = sequelize.define("Rol", {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    state: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },

    company: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    editable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }

}, {
    tableName: "rol",
    timestamps: false,
});

module.exports = Rol;