const router = require("express").Router();
const controller = require("../../controllers/unitOfMeasure.controller");
const Module = "unitOfMeasuremet";

router.get("/unitOfMeasuremet", controller.get);

module.exports = router;
