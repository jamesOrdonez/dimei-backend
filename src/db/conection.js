const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    timezone: "-05:00", // Zona horaria de Colombia (UTC-5) para que guarde la hora local exacta
    dialectOptions: {
      timezone: "-05:00",
    },
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Conectado a la bd");
  } catch (error) {
    console.error("Error conectando a la base de datos:", error.message);
  }
}

testConnection();

module.exports = sequelize;
