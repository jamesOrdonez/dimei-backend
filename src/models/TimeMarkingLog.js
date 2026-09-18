const { DataTypes } = require("sequelize");
const sequelize = require("../db/conection");
const User = require("./user");
const TimeRecord = require("./TimeRecord");

const TimeMarkingLog = sequelize.define("TimeMarkingLog", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    time_record_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },

    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    company: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    // Tipo de marcación: 'entry', 'lunch_start', 'lunch_end', 'exit'
    marking_type: {
        type: DataTypes.STRING(30),
        allowNull: false,
    },

    // Fecha y hora exacta de la marcación
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },

    // Ruta o URL de la foto capturada (/uploads/attendance/...)
    photo_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    // Coordenadas geográficas
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },

    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
    },

    // Margen de precisión de GPS en metros
    accuracy: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },

    // Justificación en caso de horas extra u observaciones
    justification: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

}, {
    tableName: "time_marking_logs",
    timestamps: false,
});

// Asegurar que la tabla y todas las columnas existan en MySQL
async function ensureColumns() {
    try {
        await TimeMarkingLog.sync({ alter: false });
        const queryInterface = sequelize.getQueryInterface();
        const tableDesc = await queryInterface.describeTable("time_marking_logs");
        if (!tableDesc.justification) {
            await queryInterface.addColumn("time_marking_logs", "justification", {
                type: DataTypes.TEXT,
                allowNull: true,
            });
            console.log("Columna justification agregada a time_marking_logs");
        }
        if (!tableDesc.accuracy) {
            await queryInterface.addColumn("time_marking_logs", "accuracy", {
                type: DataTypes.FLOAT,
                allowNull: true,
            });
        }
        if (!tableDesc.latitude) {
            await queryInterface.addColumn("time_marking_logs", "latitude", {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: true,
            });
        }
        if (!tableDesc.longitude) {
            await queryInterface.addColumn("time_marking_logs", "longitude", {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: true,
            });
        }
        if (!tableDesc.photo_url) {
            await queryInterface.addColumn("time_marking_logs", "photo_url", {
                type: DataTypes.TEXT,
                allowNull: true,
            });
        }
    } catch (err) {
        console.warn("ensureColumns time_marking_logs:", err.message);
    }
}
ensureColumns();

TimeMarkingLog.belongsTo(User, { foreignKey: "user_id", as: "User" });
User.hasMany(TimeMarkingLog, { foreignKey: "user_id", as: "MarkingLogs" });

TimeMarkingLog.belongsTo(TimeRecord, { foreignKey: "time_record_id", as: "TimeRecord" });
TimeRecord.hasMany(TimeMarkingLog, { foreignKey: "time_record_id", as: "MarkingLogs" });

module.exports = TimeMarkingLog;
