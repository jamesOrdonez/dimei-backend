const router = require("express").Router();
const controller = require("../../controllers/unitOfMeasure.controller");
const Module = "unitOfMeasuremet";

router.get("/unitOfMeasuremet", controller.get);
router.post("/unitOfMeasuremet", controller.post);
router.put("/unitOfMeasuremet/:id", controller.update);
router.delete("/unitOfMeasuremet/:id", controller.Delete);

module.exports = router;
