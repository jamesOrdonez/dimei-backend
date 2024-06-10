//*Conexion a la bd

const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "dimei",
  port: 3306,
});

//exportamos la conexion
module.exports = connection;
