require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT;

const v1Routes = require("./routes");
const { verifyToken } = require("./middleware/protected.route");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // ✅ la línea que pediste
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use("/api/v1/uploads", verifyToken, express.static(path.join(__dirname, "../uploads")));
app.use("/api/v1/", v1Routes);

app.get("/", (req, res) => {
  res.send("GET API DIMEI BACKEND");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});