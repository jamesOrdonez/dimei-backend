const express = require("express");
const routes = express();

const User = require("../routes/user.routes");
const Login = require("../routes/login.routes");

routes.use(User);
routes.use(Login);

module.exports = routes;