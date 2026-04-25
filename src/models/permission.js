const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const Rol = require("./rol");
const PermissionCatalog = require("./permissionCatalog");

const Permission = sequelize.define("Permission", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rol: { type: DataTypes.INTEGER, allowNull: false },
    company: { type: DataTypes.INTEGER, allowNull: false },
    id_permiso: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "FK a permission_catalog.id",
    },
}, {
    tableName: "permission",
    timestamps: false,
});

// Asociaciones
Permission.belongsTo(Rol, { foreignKey: "rol", as: "Rol" });
Rol.hasMany(Permission, { foreignKey: "rol", as: "Permissions" });

Permission.belongsTo(PermissionCatalog, { foreignKey: "id_permiso", as: "Catalog" });
PermissionCatalog.hasMany(Permission, { foreignKey: "id_permiso", as: "Privileges" });

module.exports = Permission;