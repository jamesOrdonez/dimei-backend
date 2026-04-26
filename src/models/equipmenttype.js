const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");

const EquipmentType = sequelize.define("EquipmentType", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    equipmentType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    company: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    tableName: "equipmenttype",
    timestamps: false,
});

module.exports = EquipmentType;