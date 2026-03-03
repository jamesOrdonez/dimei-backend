const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const Rol = require("./rol");
const Module = require("./modules");

const Permission = sequelize.define("Permission", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rol: { type: DataTypes.INTEGER, allowNull: false },
    module: { type: DataTypes.INTEGER, allowNull: false },
    permiss: { type: DataTypes.STRING, allowNull: false }, // Ej: 'GET', 'POST'
}, {
    tableName: "permission",
    timestamps: false,
});

// Asociaciones con alias
Permission.belongsTo(Rol, { foreignKey: "rol", as: "Rol" });
Rol.hasMany(Permission, { foreignKey: "rol", as: "Permissions" });

Permission.belongsTo(Module, { foreignKey: "module", as: "Module" });
Module.hasMany(Permission, { foreignKey: "module", as: "Permissions" });

module.exports = Permission;