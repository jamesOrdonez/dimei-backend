const router = require("express").Router();
const ToolUnitOfMeasureController = require("../../controllers/toolUnitOfMeasure.controller");
const protectedRoute = require("../../middleware/protected.route");
const Module = "tool_unit_of_measure";

const options = { Module };

router
  .get("/getToolUnitOfMeasure/:id", protectedRoute(options), ToolUnitOfMeasureController.getToolUnitOfMeasures)
  .post("/saveToolUnitOfMeasure", protectedRoute(options), ToolUnitOfMeasureController.saveToolUnitOfMeasure)
  .put("/updateToolUnitOfMeasure/:id", protectedRoute(options), ToolUnitOfMeasureController.updateToolUnitOfMeasure)
  .delete("/deleteToolUnitOfMeasure/:id", protectedRoute(options), ToolUnitOfMeasureController.deleteToolUnitOfMeasure);

module.exports = router;
