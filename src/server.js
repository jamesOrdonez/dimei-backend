//! API documentation for the following methods
const express = require("express");
const body = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 8080;

const v1Routes = require("./v1/routes");

app.use(cors());
app.use(express.json());
app.use(body.json({ limit: "50mb", extended: true }));
app.use(body.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use("/api/v1/", v1Routes);

app.listen(PORT, () => {
  console.warn(`server listening on port ${PORT}`);
});
