const express = require("express");
const body = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 8080;

const v1Routes = require("./routes");

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(body.json({ limit: "50mb", extended: true }));
app.use(body.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/v1/", v1Routes);

app.get("/", (req, res) => {
  res.send("GET API DIMEI BACKEND ✅");
});

app.listen(PORT, () => {
  console.warn(`server listening on port ${PORT}`);
});
