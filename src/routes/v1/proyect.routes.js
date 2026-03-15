const router = require("express").Router();
const controller = require("../../controllers/proyects.controller");

router.post("/saveProject", controller.save);

module.exports = router;
