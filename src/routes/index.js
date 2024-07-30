const express = require("express");
const routes = express();

const User = require("./v1/user.routes");
const Login = require("./v1/login.routes");
const ItemGroup = require("./v1/item_group.routes");
const Item = require("./v1/items.routes");
const Product = require("./v1/product.routes");
const Module = require("./v1/module.routes");
const Permission = require("./v1/permission.routes");
const Item_Product = require("./v1/item_product.routes");

routes.use(User);
routes.use(Login);
routes.use(ItemGroup);
routes.use(Item);
routes.use(Product);
routes.use(Module);
routes.use(Permission);
routes.use(Item_Product);

module.exports = routes;