const router = require("express").Router();
const ItemController = require("../../controllers/item.controller");
const { upload } = require("../../middleware/multer");
const protectedRoute = require("../../middleware/protected.route");
const Module = "item";

const options = {
  Module: Module,
};

router
  .post(
    "/saveItem",
    upload.single("img"),
    protectedRoute(options),
    ItemController.saveItems,
  )
  .get("/public/item/:id", ItemController.getOneItem)
  .get("/getItem/:id", ItemController.getItems)
  .get("/getItem/image/:id", ItemController.getItemImage)
  .get("/inventoryLog/item/:id", protectedRoute(options), ItemController.getInventoryLogByItem)
  .get("/oneItem/:id", protectedRoute(options), ItemController.getOneItem)
  .put(
    "/updateItem/:id",
    upload.single("img"),
    protectedRoute(options),
    ItemController.updateItem,
  )
  .put("/entrance/:id", protectedRoute(options), ItemController.entranceItems)
  .put("/exit/:id", protectedRoute(options), ItemController.exitItems)
  .delete(
    "/deleteItem/:id",
    protectedRoute(options),
    ItemController.deleteItem,
  );

module.exports = router;
