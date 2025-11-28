// * Conexion a la BD
const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "vps.equiposdimei.com",
  user: "root",
  password: "qwerty38/*",
  database: "dimei",
  port: 3306,
});

async function testConnection() {
  try {
    const conn = await connection.getConnection();
    console.log("🟢 Conectado correctamente a la base de datos");
    conn.release();
  } catch (error) {
    console.error("🔴 Error conectando a la base de datos:", error.message);
  }
}

testConnection();

module.exports = connection;
