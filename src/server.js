const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 8080;

const v1Routes = require("./v1/routes");

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Configuración CORS 
app.use(cors({
  origin: "http://vps.equiposdimei.com",
  methods: ["GET","POST","PUT","DELETE","PATCH"],
  credentials: true // si envías cookies
}));

// Rutas
app.use("/api/v1/", v1Routes);

// Servidor
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
