const protectedRoute = require("../../middleware/protected.route");
const router = require("express").Router();
const controller = require("../../controllers/item_proyect.controller");

router
  .get("/getItemProyect/:id", controller.getItemProyect)
  .post("/saveItemProyect", controller.save)
  .put("/updateItemProyect/:id", controller.updateItemProyect)
  .delete("/deleteItemProyect/:id", controller.deleted);

module.exports = router;
