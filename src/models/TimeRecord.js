const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const User = require("./user");

const TimeRecord = sequelize.define("TimeRecord", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    company: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    // Fecha del registro (sin hora), clave única con user_id
    record_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },

    // Hora real de llegada
    entry_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    // Hora real de salida a almuerzo
    lunch_start: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    // Hora real de regreso de almuerzo
    lunch_end: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    // Hora real de salida de labores
    exit_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    // 1 si el día fue marcado como festivo (automático o manual)
    is_holiday: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
    },

    // Justificación ingresada por el técnico si se generaron horas extra al cerrar labores
    overtime_justification: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    // 1 si el usuario omitió el almuerzo
    lunch_omitted: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
    },

    // Justificación ingresada cuando se omite el almuerzo
    lunch_justification: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

}, {
    tableName: "time_record",
    timestamps: false,   // La BD maneja created_at con DEFAULT CURRENT_TIMESTAMP
});

// Asegurar que las columnas existan en MySQL
async function ensureColumns() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableDesc = await queryInterface.describeTable("time_record");
        if (!tableDesc.overtime_justification) {
            await queryInterface.addColumn("time_record", "overtime_justification", {
                type: DataTypes.TEXT,
                allowNull: true,
            });
            console.log("Columna overtime_justification agregada a time_record");
        }
        if (!tableDesc.lunch_omitted) {
            await queryInterface.addColumn("time_record", "lunch_omitted", {
                type: DataTypes.TINYINT,
                defaultValue: 0,
            });
            console.log("Columna lunch_omitted agregada a time_record");
        }
        if (!tableDesc.lunch_justification) {
            await queryInterface.addColumn("time_record", "lunch_justification", {
                type: DataTypes.TEXT,
                allowNull: true,
            });
            console.log("Columna lunch_justification agregada a time_record");
        }
    } catch (e) {
        console.warn("Verificación de columnas en time_record:", e.message);
    }
}
ensureColumns();

TimeRecord.belongsTo(User, { foreignKey: "user_id", as: "User" });
User.hasMany(TimeRecord, { foreignKey: "user_id", as: "TimeRecords" });

module.exports = TimeRecord;
