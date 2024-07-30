const router = require("express").Router();
const itemGroupController = require("../../controllers/item_group.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "item_group";

const options = {
      Module: Module
}

router.get("/getItemGroup", protectedRoute(options), itemGroupController.getItemGroup)
      .get("/oneItemgroup", protectedRoute(options), itemGroupController.getOneItemGroup)
      .post("/saveItemGroup", protectedRoute(options), itemGroupController.saveItem)
      .put("/updateItemGroup/:id", protectedRoute(options), itemGroupController.updateItemGroup)
      .delete("/deleteItemgroup/:id", protectedRoute(options), itemGroupController.deleteItemGroup);

module.exports = router;