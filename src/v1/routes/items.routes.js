const router = require("express").Router();
const ItemController = require("../../controllers/item.controller");
const Module = "item";

router.post("/saveItem", ItemController.saveItems)
       .get('/getItem', ItemController.getItems)
       .get('/oneItem', ItemController.getOneItem)
       .put('/updateItem/:id',ItemController.updateItem)
       .delete('/deleteItem/:id', ItemController.deleteItem);

module.exports = router;