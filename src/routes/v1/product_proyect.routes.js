const protectedRoute = require("../../middleware/protected.route");
const router = require("express").Router();
const controller = require("../../controllers/product_proyect.controller");

router
  .get("/getProductProyect/:id", controller.getProductProyect)
  .post("/saveproductProyect", controller.save)
  .put("/updateProductProyect/:id", controller.updateProductProyect)
  .delete("/deleteProductProyect/:id", controller.deleted);

module.exports = router;
