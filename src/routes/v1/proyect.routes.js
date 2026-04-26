const router = require("express").Router();
const controller = require("../../controllers/proyects.controller");
const { upload } = require("../../middleware/multer");

router
  .get("/getProjects/:id", controller.getProject)
  .get("/getOneProject/:id", controller.getOneProject)
  .post("/saveProject", controller.save)
  .get("/getInventoryComparison/:company", controller.getInventoryComparison)
  .patch("/updateProjectStatus/:id", controller.updateState)
  .post("/uploadSignedAct/:id", upload.single("signed_act"), controller.uploadSignedAct)
  .get("/getSignedAct/:id", controller.getSignedAct);

module.exports = router;
