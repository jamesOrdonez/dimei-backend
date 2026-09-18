require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: console.log,
  }
);

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a la BD");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS rol_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rol_id INT NOT NULL,
        company INT NOT NULL,
        entry_time TIME NOT NULL COMMENT 'Hora de entrada esperada',
        lunch_start TIME NOT NULL COMMENT 'Inicio almuerzo',
        lunch_end TIME NOT NULL COMMENT 'Fin almuerzo',
        exit_time TIME NOT NULL COMMENT 'Hora de salida esperada',
        UNIQUE KEY uq_rol_company (rol_id, company),
        FOREIGN KEY (rol_id) REFERENCES rol(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("✅ Tabla rol_schedule creada (o ya existía)");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS time_record (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        company INT NOT NULL,
        record_date DATE NOT NULL,
        entry_time DATETIME NULL COMMENT 'Hora de llegada a labores',
        lunch_start DATETIME NULL COMMENT 'Salida a almuerzo',
        lunch_end DATETIME NULL COMMENT 'Regreso de almuerzo',
        exit_time DATETIME NULL COMMENT 'Salida de labores',
        is_holiday TINYINT(1) DEFAULT 0 COMMENT '1 si el día es festivo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_date (user_id, record_date),
        FOREIGN KEY (user_id) REFERENCES user(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("✅ Tabla time_record creada (o ya existía)");

    console.log("\n✅ Migración completada exitosamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en migración:", error.message);
    process.exit(1);
  }
}

migrate();
