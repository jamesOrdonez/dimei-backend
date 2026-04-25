const { DataTypes } = require('sequelize');
const sequelize = require('../db/conection');
const contact_client = require('./contactClient')

const Client = sequelize.define('client', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    nombre: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    nit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    company: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    tipo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'cliente',
    },
    estado: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: null,
    },
}, {
    freezeTableName: true,
    timestamps: false,
});

Client.hasMany(contact_client, { foreignKey: 'client', as: 'contactos' });
contact_client.belongsTo(Client, { foreignKey: 'client', as: 'cliente' });

module.exports = Client;