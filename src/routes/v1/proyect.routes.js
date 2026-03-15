const router = require("express").Router();
const controller = require("../../controllers/proyects.controller");

router
  .get("/getProjects/:id", controller.getProject)
  .post("/saveProject", controller.save);

module.exports = router;
