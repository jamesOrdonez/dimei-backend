const router = require("express").Router();
const protectedRoute = require("../../middleware/protected.route");
const controller = require("../../controllers/item_product.controller");
const Module = "item_product";

const options = {
    Module: Module
}

router
    .get("/getItemProduct/:id", protectedRoute(options), controller.getItemProduct)
    .post("/saveItemProduct", protectedRoute(options), controller.saveItemProduct)
    .put("/updateItemProduct/:id", protectedRoute(options), controller.updateItemProduct)
    .delete("/deleteItemProduct/:id", protectedRoute(options), controller.deleteItemProduct);

module.exports = router;
