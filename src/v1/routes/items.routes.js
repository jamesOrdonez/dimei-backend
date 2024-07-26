const router = require("express").Router();
const ItemController = require("../../controllers/item.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "item";

const options = {
       Module:Module
}

router.post("/saveItem",protectedRoute(options), ItemController.saveItems)
       .get('/getItem', protectedRoute(options), ItemController.getItems)
       .get('/oneItem',protectedRoute(options), ItemController.getOneItem)
       .put('/updateItem/:id',protectedRoute(options),ItemController.updateItem)
       .delete('/deleteItem/:id',protectedRoute(options), ItemController.deleteItem);

module.exports = router;