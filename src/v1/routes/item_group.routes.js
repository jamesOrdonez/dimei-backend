const router = require("express").Router();
const itemGroupController = require("../../controllers/item.group.controller");
const Module = "item_group";

router.get("/getItemGroup", itemGroupController.getItemGroup)
      .post("/saveItemGroup", itemGroupController.saveItem);

module.exports = router;