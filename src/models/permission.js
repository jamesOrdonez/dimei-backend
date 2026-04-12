const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const Rol = require("./rol");

const Permission = sequelize.define("Permission", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rol: { type: DataTypes.INTEGER, allowNull: false },
    company: { type: DataTypes.INTEGER, allowNull: false },
    // Permiso literal de negocio, ej: "Acceso a ingresar material"
    permiss: { type: DataTypes.STRING(255), allowNull: false },
}, {
    tableName: "permission",
    timestamps: false,
});

// Asociaciones
Permission.belongsTo(Rol, { foreignKey: "rol", as: "Rol" });
Rol.hasMany(Permission, { foreignKey: "rol", as: "Permissions" });

module.exports = Permission;