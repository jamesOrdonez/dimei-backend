const router = require("express").Router();
const ItemController = require("../../controllers/item.controller");
const Module = "item";

router.post("/saveItem", ItemController.saveItems);

module.exports = router;