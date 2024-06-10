const express = require("express");
const routes = express();

const User = require("./user.routes");
const Login = require("./login.routes");
const ItemGroup = require("./item_group.routes");
const Item = require("./items.routes")

routes.use(User);
routes.use(Login);
routes.use(ItemGroup);
routes.use(Item);

module.exports = routes;