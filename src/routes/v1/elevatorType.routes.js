const router = require("express").Router();
const controller = require("../../controllers/elevatorType.controller");

router
  .get("/getElevatorTypes/:id", controller.getType)
  .post("/saveElevatorTypes", controller.save)
  .put("/updateElevatorType/:id", controller.updateType)
  .delete("/deleteElevatorType/:id", controller.deleteType);

module.exports = router;
