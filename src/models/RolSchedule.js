const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const Rol = require("./rol");

const RolSchedule = sequelize.define("RolSchedule", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    rol_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    company: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    // Hora de entrada esperada (ej: "07:00:00")
    entry_time: {
        type: DataTypes.TIME,
        allowNull: false,
    },

    // Inicio de almuerzo (opcional, el almuerzo se descuenta según marcación real)
    lunch_start: {
        type: DataTypes.TIME,
        allowNull: true,
    },

    // Fin de almuerzo (opcional, el almuerzo se descuenta según marcación real)
    lunch_end: {
        type: DataTypes.TIME,
        allowNull: true,
    },

    // Hora de salida esperada
    exit_time: {
        type: DataTypes.TIME,
        allowNull: false,
    },

    // Hora de entrada esperada sábados (opcional)
    saturday_entry_time: {
        type: DataTypes.TIME,
        allowNull: true,
    },

    // Hora de salida esperada sábados (ej: "12:00:00")
    saturday_exit_time: {
        type: DataTypes.TIME,
        allowNull: true,
    },

}, {
    tableName: "rol_schedule",
    timestamps: false,
});

// Asegurar que las columnas nuevas existan en MySQL
async function ensureColumns() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableDesc = await queryInterface.describeTable("rol_schedule");
        if (!tableDesc.saturday_entry_time) {
            await queryInterface.addColumn("rol_schedule", "saturday_entry_time", {
                type: DataTypes.TIME,
                allowNull: true,
            });
            console.log("Columna saturday_entry_time agregada a rol_schedule");
        }
        if (!tableDesc.saturday_exit_time) {
            await queryInterface.addColumn("rol_schedule", "saturday_exit_time", {
                type: DataTypes.TIME,
                allowNull: true,
            });
            console.log("Columna saturday_exit_time agregada a rol_schedule");
        }
    } catch (e) {
        console.warn("Verificación de columnas rol_schedule:", e.message);
    }
}
ensureColumns();

RolSchedule.belongsTo(Rol, { foreignKey: "rol_id", as: "Rol" });
Rol.hasOne(RolSchedule, { foreignKey: "rol_id", as: "Schedule" });

module.exports = RolSchedule;
