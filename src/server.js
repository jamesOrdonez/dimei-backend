const express = require("express");
const body = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 8080;

const v1Routes = require("./routes");

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Configuración CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // si envías cookies
  })
);

// Rutas
app.use("/api/v1/", v1Routes);
app.get("/", (req, res) => {
  res.send("GET API DIMEI BACKEND ✅");
});

// Servidor

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
