const { DataTypes } = require('sequelize');
const sequelize = require('../db/conection');

const ContactClient = sequelize.define('contact_client', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
    },
    cargo: {
        type: DataTypes.STRING(60),
        allowNull: true,
        defaultValue: null,
    },
    telefono: {
        type: DataTypes.STRING(70),
        allowNull: true,
        defaultValue: null,
    },
    correo: {
        type: DataTypes.STRING(70),
        allowNull: true,
        defaultValue: null,
    },
    contactoPrincipal: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: null,
    },
    client: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    company: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = ContactClient;