const router = require("express").Router();
const controller = require("../../controllers/proyects.controller");

router
  .get("/getProjects/:id", controller.getProject)
  .get("/getOneProject/:id", controller.getOneProject)
  .post("/saveProject", controller.save);

module.exports = router;
