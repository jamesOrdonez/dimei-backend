const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const PermissionCatalog = sequelize.define("PermissionCatalog", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Nombre literal del permiso, ej: "Crear proyectos"',
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
}, {
    tableName: "permission_catalog",
    timestamps: false,
});

module.exports = PermissionCatalog;
