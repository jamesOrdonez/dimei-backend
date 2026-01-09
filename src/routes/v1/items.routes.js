const router = require("express").Router();
const ItemController = require("../../controllers/item.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "item";

const options = {
  Module: Module,
};

router
  .post("/saveItem", protectedRoute(options), ItemController.saveItems)
  .get("/getItem/:id", protectedRoute(options), ItemController.getItems)
  .get("/oneItem/:id", protectedRoute(options), ItemController.getOneItem)
  .put("/updateItem/:id", protectedRoute(options), ItemController.updateItem)
  .put("/entrance/:id", protectedRoute(options), ItemController.entranceItems)
  .put("/exit/:id", protectedRoute(options), ItemController.exitItems)
  .delete(
    "/deleteItem/:id",
    protectedRoute(options),
    ItemController.deleteItem
  );

module.exports = router;
