const router = require("express").Router();
const controller = require("../../controllers/typeDriveSystem.controller");

router
  .get("/getTypeDriveSystems/:id", controller.getDriveSystem)
  .post("/saveTypeDriveSystems", controller.save)
  .put("/updateTypeDriveSystems/:id", controller.updateDriveSystem)
  .delete("/deleteTypeDriveSystems/:id", controller.deleteDriveSystem);

module.exports = router;
